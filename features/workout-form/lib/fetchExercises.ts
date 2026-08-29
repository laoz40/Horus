import { createSuggestionObject } from "./convertWorkoutData";
import { DEFAULT_EXERCISES } from "./defaultExercises";
import { normalizeName } from "@/lib/normalizeName";
import type { WgerExerciseResponse } from "./wgerTypes";
import { err, ok } from "neverthrow";

export const fetchDefaultExercises = (query: string) => {
	const matchedDefaultExercises = DEFAULT_EXERCISES.filter((exercise) =>
		normalizeName(exercise.name).includes(normalizeName(query)),
	);
	return matchedDefaultExercises.map(createSuggestionObject);
};

export const fetchApiExercises = async (query: string) => {
	const url = new URL("https://wger.de/api/v2/exerciseinfo/");
	url.searchParams.set("language__code", "en");
	url.searchParams.set("limit", "10");
	url.searchParams.set("name__search", query);

	console.log(url.toString());

	const response = await fetch(url.toString(), {
		method: "GET",
		next: {
			revalidate: 60 * 60 * 24 * 30, // cache for 30 days
		},
	});

	if (response.status === 429) {
		return err({
			code: "RATE_LIMITED",
		} as const);
	}

	if (!response.ok) {
		return err({
			code: "REQUEST_FAILED",
		} as const);
	}

	const matchedWgerExercises = (await response.json()) as WgerExerciseResponse;
	const results = Array.isArray(matchedWgerExercises.results) ? matchedWgerExercises.results : [];

	return ok(
		results.flatMap((exercise) => {
			// get english exercise name
			const englishTranslation = exercise.translations?.find(
				(translation) => translation.language === 2 && translation.name.trim().length > 0,
			);
			if (!englishTranslation) return [];

			const name = englishTranslation.name;

			if (!name) return [];

			const muscleGroups = [...(exercise.muscles ?? []), ...(exercise.muscles_secondary ?? [])]
				.map((muscle) => muscle.name_en ?? muscle.name)
				.filter((muscleName): muscleName is string => Boolean(muscleName?.trim()));

			const deduplicatedMuscleGroups = Array.from(new Set(muscleGroups));
			const fallbackMuscleGroups =
				deduplicatedMuscleGroups.length > 0
					? deduplicatedMuscleGroups
					: exercise.category?.name?.trim()
						? [exercise.category.name]
						: undefined;

			return [
				createSuggestionObject({
					id: String(exercise.id),
					name,
					muscleGroups: fallbackMuscleGroups,
				}),
			];
		}),
	);
};
