import { createSuggestionObject } from "./convertWorkoutData";
import { DEFAULT_EXERCISES } from "./defaultExercises";
import { normalizeExerciseName } from "@/lib/workout/normalizeExerciseName";

export const fetchDefaultExercises = async (query: string) => {
	const matchedDefaultExercises = DEFAULT_EXERCISES.filter((exercise) =>
		normalizeExerciseName(exercise.name).includes(normalizeExerciseName(query)),
	);
	return matchedDefaultExercises.map(createSuggestionObject);
};

export const fetchApiExercises = async (query: string) => {
	const apiKey = process.env.EXERCISEDB_API_KEY;
	if (!apiKey) {
		throw new Error("API key not set");
	}

	const url = new URL(
		"https://exercisedb-api.vercel.app/api/v1/exercises/filter",
	);
	url.searchParams.set("search", query);
	url.searchParams.set("limit", "10");
	url.searchParams.set("sortBy", "name");
	url.searchParams.set("sortOrder", "asc");

	const response = await fetch(url.toString(), {
		method: "GET",
		headers: {
			"x-rapidapi-key": apiKey,
			"x-rapidapi-host": "exercisedb.p.rapidapi.com",
		},
	});

	if (response.status === 429) {
		throw new Error("Too many requests");
	}

	if (!response.ok) {
		throw new Error(`API Error: ${response.status} ${response.statusText}`);
	}

	const matchedApiExercises = await response.json();
	return matchedApiExercises.data.map(createSuggestionObject);
};
