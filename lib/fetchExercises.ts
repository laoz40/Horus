import { NextResponse } from "next/server";
import {
	createSuggestionObject,
	normalizeExerciseName,
} from "./convertWorkoutData";
import { DEFAULT_EXERCISES } from "./defaultExercises";
import { db } from "./prisma";

export const fetchDefaultExercises = async (query: string) => {
	const matchedDefaultExercises = DEFAULT_EXERCISES.filter((exercise) =>
		normalizeExerciseName(exercise.name).includes(normalizeExerciseName(query)),
	);
	return matchedDefaultExercises.map(createSuggestionObject);
};

export const fetchDbExercises = async (query: string) => {
	const matchedDbExercises = await db.globalExercise.findMany({
		where: {
			name: {
				contains: query,
			},
		},
		take: 10,
		orderBy: {
			name: "asc",
		},
	});
	return matchedDbExercises.map(createSuggestionObject);
};

export const fetchApiExercises = async (query: string) => {
	const apiKey = process.env.EXERCISEDB_API_KEY;
	if (!apiKey) {
		return NextResponse.json({
			success: false,
			exercises: [],
			error: "API key not set",
		});
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

	if (!response.ok) {
		const errorText = await response.text();
		console.error("API error:", response.status, errorText);

		return NextResponse.json({
			success: false,
			exercises: [],
			error: `External API error: ${response.status}`,
		});
	}

	const matchedApiExercises = await response.json();
	return matchedApiExercises.data.map(createSuggestionObject);
};
