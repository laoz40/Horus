import { NextResponse } from "next/server";
import { WorkoutFormData } from "@/features/workout-form/lib/types";
import { db } from "@/lib/prisma";
import { parseWorkout } from "@/lib/workout/parseWorkout";
import { validateWorkout } from "@/features/workout-form/lib/validateWorkout";
import { calculateWorkoutVolume } from "@/lib/workout/calculateStatVolume";
import { countTotalPrSetsInWorkout } from "@/lib/workout/calculateStatPr";
import { fromZodError } from "zod-validation-error";
import { mapExercisesWithGlobalIds } from "@/lib/globalExercise";
import {
	getPreviousCompletedSetsByGlobalExerciseIds,
	getTargetGlobalExerciseIds,
	toCurrentWorkoutForPr,
	toPrBaselineSets,
} from "@/lib/workoutPrSets";

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
			errors: fromZodError(validationResult.error),
		});
	}

	const validWorkout = validationResult.data;
	const exercisesToCreate = await mapExercisesWithGlobalIds(validWorkout.exercises);
	const targetExerciseIds = getTargetGlobalExerciseIds(exercisesToCreate);
	const previousSets = await getPreviousCompletedSetsByGlobalExerciseIds(
		targetExerciseIds,
	);

	const totalVolume = calculateWorkoutVolume(validWorkout);
	const totalPrSets = countTotalPrSetsInWorkout(
		toCurrentWorkoutForPr(exercisesToCreate),
		toPrBaselineSets(previousSets),
	);

	await db.workout.create({
		data: {
			name: validWorkout.name,
			durationSeconds: validWorkout.durationSeconds,
			totalVolume,
			totalPrSets,
			exercises: {
				create: exercisesToCreate.map((exercise) => ({
					globalExercise: { connect: { id: exercise.globalExerciseId } },
					difficulty: exercise.difficulty ?? null,
					notes: exercise.notes ?? null,
					sets: {
						create: exercise.sets.map((set) => ({
							weight: Number(set.weight),
							reps: Number(set.reps),
							completed: set.completed ?? false,
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
