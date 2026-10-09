import "server-only";

import { Data, Effect } from "effect";
import { z } from "zod";

import { createSuggestionObject } from "@/features/workout-form/lib/convertWorkoutData";
import type { ExerciseSuggestion } from "@/features/workout-form/lib/types";
import { WgerExerciseResponseSchema } from "@/features/workout-form/lib/wgerTypes";

class RateLimitedError extends Data.TaggedError("RATE_LIMITED") {}

class RequestFailedError extends Data.TaggedError("REQUEST_FAILED")<{
	readonly reason: "network" | "http" | "invalid-json" | "invalid-response" | "timeout";
	readonly cause: unknown;
}> {}

export type FetchApiExercisesError = RateLimitedError | RequestFailedError;

type WgerExerciseResponse = z.infer<typeof WgerExerciseResponseSchema>;

type WgerExercise = WgerExerciseResponse["results"][number];

const fetchWgerExercises = (query: string) =>
	Effect.gen(function* () {
		const url = new URL("https://wger.de/api/v2/exerciseinfo/");
		url.searchParams.set("language__code", "en");
		url.searchParams.set("limit", "10");
		url.searchParams.set("name__search", query);

		// Keep the fetch signal alive through the body read; close it on completion or interruption.
		const signal = yield* Effect.abortSignal;

		const response = yield* Effect.tryPromise({
			try: () =>
				fetch(url.toString(), {
					method: "GET",
					signal,
					next: {
						revalidate: 60 * 60 * 24 * 30, // cache for 30 days
					},
				}),
			catch: (cause) => new RequestFailedError({ reason: "network", cause }),
		});

		if (response.status === 429) {
			return yield* Effect.fail(new RateLimitedError());
		}

		if (!response.ok) {
			return yield* Effect.fail(
				new RequestFailedError({
					reason: "http",
					cause: { status: response.status, statusText: response.statusText },
				}),
			);
		}

		const responseBody: unknown = yield* Effect.tryPromise({
			try: () => response.json(),
			catch: (cause) =>
				new RequestFailedError({
					reason: cause instanceof SyntaxError ? "invalid-json" : "network",
					cause,
				}),
		});

		const parsedResponse = WgerExerciseResponseSchema.safeParse(responseBody);

		if (!parsedResponse.success) {
			return yield* Effect.fail(
				new RequestFailedError({ reason: "invalid-response", cause: parsedResponse.error }),
			);
		}

		return parsedResponse.data;
	}).pipe(
		Effect.scoped,
		Effect.timeout("10 seconds"),
		Effect.catchTag("TimeoutError", (cause) =>
			Effect.fail(new RequestFailedError({ reason: "timeout", cause })),
		),
	);

const convertWgerExercise = (exercise: WgerExercise): ExerciseSuggestion | undefined => {
	const englishTranslation = exercise.translations?.find(
		(translation) => translation.language === 2 && translation.name.trim().length > 0,
	);

	if (!englishTranslation) return undefined;

	const name = englishTranslation.name;

	if (!name) return undefined;

	const muscleGroups = [...(exercise.muscles ?? []), ...(exercise.muscles_secondary ?? [])].flatMap(
		(muscle) => {
			const muscleName = muscle.name_en ?? muscle.name;

			return muscleName?.trim() ? [muscleName] : [];
		},
	);

	const deduplicatedMuscleGroups = Array.from(new Set(muscleGroups));

	const categoryMuscleGroups = exercise.category?.name?.trim()
		? [exercise.category.name]
		: undefined;

	const fallbackMuscleGroups =
		deduplicatedMuscleGroups.length > 0 ? deduplicatedMuscleGroups : categoryMuscleGroups;

	return createSuggestionObject({
		id: String(exercise.id),
		name,
		muscleGroups: fallbackMuscleGroups,
	});
};

export const fetchApiExercises = (
	query: string,
): Effect.Effect<ExerciseSuggestion[], FetchApiExercisesError> =>
	Effect.gen(function* () {
		const parsedResponse = yield* fetchWgerExercises(query);

		return parsedResponse.results.flatMap((exercise) => {
			const suggestion = convertWgerExercise(exercise);

			return suggestion ? [suggestion] : [];
		});
	});
