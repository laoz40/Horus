import { NextResponse } from "next/server";
import { fetchApiExercises } from "@/features/workout-form/lib/fetchExercises";

const emptyExercisesResponse = (status: number) => {
	return NextResponse.json(
		{
			success: false,
			exercises: [],
		},
		{ status },
	);
};

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const query = searchParams.get("query");

	if (!query) {
		return NextResponse.json({ success: false, error: "query is required" }, { status: 400 });
	}

	const result = await fetchApiExercises(query);

	return result.match(
		(exercises) => {
			return NextResponse.json({
				success: true,
				exercises,
			});
		},
		(error) => {
			const code = error.code;

			switch (code) {
				case "RATE_LIMITED":
					return emptyExercisesResponse(429);
				case "REQUEST_FAILED":
					return emptyExercisesResponse(500);
				default:
					throw new Error(`Unhandled app error code: ${code satisfies never}`);
			}
		},
	);
}
