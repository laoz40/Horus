import { NextResponse } from "next/server";
import { WorkoutFormData } from "@/lib/types";
import { db } from "@/lib/prisma";

// NOTE: currently unused, will be used later when i implement sorting/filtering?
export async function GET() {
	try {
		const getWorkouts = await db.workout.findMany({
			include: {
				exercises: {
					include: {
						sets: true,
					},
				},
			},
		});

		return NextResponse.json({ success: true, getWorkouts });
	} catch (err) {
		return NextResponse.json({ success: false, error: (err as Error).message });
	}
}

export async function POST(request: Request) {
	const newWorkout: WorkoutFormData = await request.json();

	const postWorkout = await db.workout.create({
		data: {
			name: newWorkout.name,
			durationSeconds: newWorkout.durationSeconds,
			exercises: {
				create: newWorkout.exercises.map((exercise) => ({
					name: exercise.name,
					difficulty: exercise.difficulty ?? null,
					notes: exercise.notes ?? null,
					sets: {
						create: exercise.sets.map((set) => ({
							weight: Number(set.weight),
							reps: Number(set.reps),
						})),
					},
				})),
			},
		},
		include: {
			exercises: {
				include: { sets: true },
			},
		},
	});

	return NextResponse.json({ success: true, workout: postWorkout });
}

export async function DELETE() {
	await db.workout.deleteMany();

	return NextResponse.json({ success: true });
}
