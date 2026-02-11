import {
	deduplicateExercises,
} from "@/lib/convertWorkoutData";
import { NextResponse } from "next/server";
import { fetchApiExercises, fetchDbExercises, fetchDefaultExercises } from "@/lib/fetchExercises";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const query = searchParams.get("query");
	const source = searchParams.get("source");

	if (!query) {
		return NextResponse.json({ success: false, error: "query is required" });
	}

	if (source !== "api") {
		const defaultExercises = await fetchDefaultExercises(query);
		const dbExercises = await fetchDbExercises(query);
		const mergedExercises = deduplicateExercises(dbExercises, defaultExercises);

		return NextResponse.json({
			success: mergedExercises.length > 0,
			exercises: mergedExercises,
			error: mergedExercises.length === 0 ? "Query not found" : undefined,
		});
	}

	try {
		const apiExercises = await fetchApiExercises(query);

		if (apiExercises.length === 0) {
			return NextResponse.json({
				success: false,
				exercises: [],
				error: "Query not found",
			});
		}

		return NextResponse.json({
			success: true,
			exercises: apiExercises,
		});
	} catch (error) {
		return NextResponse.json({
			success: false,
			exercises: [],
			error: error,
		});
	}
}
