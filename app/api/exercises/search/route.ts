import {
	createSuggestionObject,
	deduplicateExercises,
	normalizeExerciseName,
} from "@/lib/convertWorkoutData";
import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { DEFAULT_EXERCISES } from "@/lib/defaultExercises";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const query = searchParams.get("query");
	const source = searchParams.get("source");

	if (!query) {
		return NextResponse.json({ success: false, error: "query is required" });
	}

	if (source !== "api") {
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

		const matchedDefaultExercises = DEFAULT_EXERCISES.filter((exercise) =>
			normalizeExerciseName(exercise.name).includes(
				normalizeExerciseName(query),
			),
		);

		const defaultExercises = matchedDefaultExercises.map(
			createSuggestionObject,
		);
		const dbExercises = matchedDbExercises.map(createSuggestionObject);

		const mergedExercises = deduplicateExercises(dbExercises, defaultExercises);

		return NextResponse.json({
			success: mergedExercises.length > 0,
			exercises: mergedExercises,
			error: mergedExercises.length === 0 ? "Query not found" : undefined,
		});
	}

	const apiKey = process.env.EXERCISEDB_API_KEY;

	if (!apiKey) {
		return NextResponse.json({
			success: false,
			exercises: [],
			error: "API key not set",
		});
	}

	try {
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
		const apiExercises = matchedApiExercises.data.map(createSuggestionObject);

		return NextResponse.json({
			success: true,
			exercises: apiExercises,
		});
	} catch (error) {
		console.error("Unexpected API error:", error);
		return NextResponse.json({
			success: false,
			exercises: [],
			error: "Unexpected server error",
		});
	}
}
