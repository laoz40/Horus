import { normalizeExerciseName, toTitleCase } from "@/lib/convertWorkoutData";
import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const query = searchParams.get("query");
	const source = searchParams.get("source");

	if (!query) {
		return NextResponse.json({ success: false, error: "query is required" });
	}

	if (source !== "api") {
		const exercisesFromDb = await db.globalExercise.findMany({
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

		const formattedExercises = exercisesFromDb.map((exercise) => ({
			...exercise,
			name: toTitleCase(exercise.name),
		}));

		return NextResponse.json({
			success: formattedExercises.length > 0,
			exercises: formattedExercises,
			error: formattedExercises.length === 0 ? "Query not found" : undefined,
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

		const result = await response.json();

		const exercisesFromApi = Array.isArray(result.data)
			? result.data.map((exercise: any) => ({
					id: exercise.exerciseId,
					name: toTitleCase(exercise.name),
					normalizedName: normalizeExerciseName(exercise.name),
				}))
			: [];

		console.log(exercisesFromApi);

		return NextResponse.json({
			success: true,
			exercises: exercisesFromApi,
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
