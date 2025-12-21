import { NextResponse } from "next/server";
import { WorkoutFormData } from "@/lib/types";
import { db } from "@/lib/prisma";
import { parseWorkout } from "@/lib/parseWorkout";
import { validateWorkout } from "@/lib/validateWorkout";

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
	const rawWorkout: WorkoutFormData = await request.json();
	const parsedWorkout = parseWorkout(rawWorkout);
	const validationResult = validateWorkout(parsedWorkout);

	if (!validationResult.success) {
		return NextResponse.json({
			success: false,
			errors: validationResult.error,
		});
	}

	const validWorkout = validationResult.data

	await db.workout.create({
		data: {
			name: validWorkout.name,
			durationSeconds: validWorkout.durationSeconds,
			exercises: {
				create: validWorkout.exercises.map((exercise) => ({
					name: exercise.name,
					difficulty: exercise.difficulty ?? null,
					notes: exercise.notes ?? null,
					sets: {
						create: exercise.sets.map((set) => ({
							weight: set.weight,
							reps: set.reps,
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

	return NextResponse.json({
		success: true,
		workout: validWorkout,
	});
}

export async function DELETE() {
	await db.workout.deleteMany();

	return NextResponse.json({ success: true });
}
