"use client";

import { ORPCError } from "@orpc/client";
import { useDeferredValue, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Data, Effect } from "effect";
import { showErrorToast } from "@/lib/toastMessages";
import { deduplicateExercises } from "@/features/workout-form/lib/convertWorkoutData";
import { fetchDefaultExercises } from "@/features/workout-form/lib/fetchExercises";
import { sortExercisesAlphabetically } from "@/features/workout-form/lib/sortExercises";
import type { ExerciseSuggestion } from "@/features/workout-form/lib/types";
import { orpc } from "@/lib/orpc/client";

class RateLimitedSearchError extends Data.TaggedError("RATE_LIMITED") {}

class FailedOnlineSearchError extends Data.TaggedError("REQUEST_FAILED") {}

class UnexpectedOnlineSearchError extends Data.TaggedError("UNEXPECTED") {}

function classifyOnlineSearchError(cause: unknown) {
	if (!(cause instanceof ORPCError) || !cause.defined) {
		return new UnexpectedOnlineSearchError();
	}

	if (cause.code === "RATE_LIMITED") return new RateLimitedSearchError();

	if (cause.code === "REQUEST_FAILED") return new FailedOnlineSearchError();

	return new UnexpectedOnlineSearchError();
}

function buildExerciseSuggestions(
	query: string,
	deferredQuery: string,
	dbSearchResults: ExerciseSuggestion[] | undefined,
	defaultExercises: ExerciseSuggestion[],
	onlineExercisesByQuery: Record<string, ExerciseSuggestion[]>,
): ExerciseSuggestion[] {
	// Only use database results when they belong to the text currently in the input.
	// This prevents results for an older deferred query from appearing after the user types more.
	const isDbResultCurrent = query.length > 0 && deferredQuery === query;
	const dbExercises = isDbResultCurrent ? (dbSearchResults ?? []) : [];
	const onlineExercises = onlineExercisesByQuery[query] ?? [];

	return sortExercisesAlphabetically(
		deduplicateExercises(deduplicateExercises(defaultExercises, dbExercises), onlineExercises),
	);
}

export function useExerciseSuggestions(rawQuery: string) {
	const [isOnlineSearchLoading, setIsOnlineSearchLoading] = useState(false);

	// Online "fetch more" results are keyed by query so stale results never leak into the dropdown.
	const [onlineExercisesByQuery, setOnlineExercisesByQuery] = useState<
		Record<string, ExerciseSuggestion[]>
	>({});

	const queryClient = useQueryClient();

	const query = rawQuery.trim();
	const deferredQuery = useDeferredValue(query);
	// An empty query disables the DB search immediately.
	const dbSearchQuery = query.length === 0 ? "" : deferredQuery;

	const defaultExercises = sortExercisesAlphabetically(fetchDefaultExercises(query));

	const exerciseSearch = useQuery(
		orpc.exercises.search.queryOptions({
			input: { query: dbSearchQuery },
			enabled: dbSearchQuery.length > 0,
		}),
	);

	// Combine instant local matches with PostgreSQL matches, remove duplicates, and sort the dropdown.
	const suggestions = buildExerciseSuggestions(
		query,
		dbSearchQuery,
		exerciseSearch.data,
		defaultExercises,
		onlineExercisesByQuery,
	);

	const isDbSearchLoading =
		query.length > 0 && (deferredQuery !== query || exerciseSearch.isFetching);

	const fetchMoreSuggestions = () => {
		if (query.length === 0) return Promise.resolve();

		return Effect.runPromise(
			Effect.gen(function* () {
				yield* Effect.sync(() => setIsOnlineSearchLoading(true));

				const exercises = yield* Effect.tryPromise({
					try: () =>
						queryClient.fetchQuery(
							orpc.exercises.searchOnline.queryOptions({
								input: { query },
								staleTime: 1000 * 60 * 1,
								gcTime: 1000 * 60 * 3,
							}),
						),
					catch: classifyOnlineSearchError,
				});

				if (exercises.length > 0) {
					yield* Effect.sync(() =>
						setOnlineExercisesByQuery((prev) => ({
							...prev,
							[query]: deduplicateExercises(prev[query] ?? [], exercises),
						})),
					);
				}
			}).pipe(
				Effect.catchTags({
					RATE_LIMITED: () =>
						Effect.sync(() => showErrorToast("Too many requests. Please try again later.")),
					REQUEST_FAILED: () => Effect.sync(() => showErrorToast("Failed to fetch exercises.")),
					UNEXPECTED: () => Effect.sync(() => showErrorToast("Failed to fetch exercises.")),
				}),
				Effect.ensuring(Effect.sync(() => setIsOnlineSearchLoading(false))),
			),
		);
	};

	const isLoading = isDbSearchLoading || isOnlineSearchLoading;

	return {
		suggestions,
		isDbSearchLoading,
		isLoading,
		isOnlineSearchLoading,
		fetchMoreSuggestions,
	};
}
