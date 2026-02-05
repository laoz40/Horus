import { fetchExercisesFromApi } from "@/lib/exercisesDb";
import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const query = searchParams.get("query");
	if (!query) {
		return NextResponse.json({ success: false, error: "query is required" });
	}

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

	if (exercisesFromDb.length === 0) {
		const exercisesFromApi = await fetchExercisesFromApi(query);
		return NextResponse.json({ success: true, exercises: exercisesFromApi });
	} else {
		return NextResponse.json({ success: true, exercises: exercisesFromDb });
	}
}
