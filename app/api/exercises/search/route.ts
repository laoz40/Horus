import { NextResponse } from "next/server";
import { fetchApiExercises } from "@/features/workout-form/lib/fetchExercises";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const query = searchParams.get("query");

	if (!query) {
		return NextResponse.json({ success: false, error: "query is required" });
	}

	try {
		const apiExercises = await fetchApiExercises(query);

		return NextResponse.json({
			success: true,
			exercises: apiExercises,
		});
	} catch (error) {
		// TODO: redo error handling
		const message =
			error instanceof Error ? error.message : "Failed to fetch exercises";

		return NextResponse.json(
			{
				success: false,
				exercises: [],
				error: message,
			},
			{ status: message === "Too many requests" ? 429 : 500 },
		);
	}
}
