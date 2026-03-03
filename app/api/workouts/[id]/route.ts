import { parseWorkout } from "@/lib/workout/parseWorkout";
import { db } from "@/lib/prisma";
import { WorkoutFormData } from "@/features/workout-form/lib/types";
import { validateWorkout } from "@/features/workout-form/lib/validateWorkout";
import {
	countTotalPrSetsInWorkout,
	calculateWorkoutVolume,
} from "@/lib/calculateWorkoutStats";
import { NextResponse } from "next/server";
import { fromZodError } from "zod-validation-error";
import { mapExercisesWithGlobalIds } from "@/lib/globalExercise";
import {
	getHistoricalCompletedSetsByGlobalExerciseIdsBeforeDate,
	getTargetGlobalExerciseIds,
	toCurrentWorkoutForPr,
	toPrBaselineSets,
} from "@/lib/workoutPrSets";

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
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
	const totalVolume = calculateWorkoutVolume(validWorkout);
	const exercisesToUpdate = await mapExercisesWithGlobalIds(validWorkout.exercises);

	const workoutToUpdate = await db.workout.findUnique({
		where: { id },
		select: { createdAt: true },
	});

	if (!workoutToUpdate) {
		return NextResponse.json(
			{ success: false, error: "Workout not found" },
			{ status: 404 },
		);
	}

	const targetExerciseIds = getTargetGlobalExerciseIds(exercisesToUpdate);
	const historicalSets =
		await getHistoricalCompletedSetsByGlobalExerciseIdsBeforeDate(
			targetExerciseIds,
			workoutToUpdate.createdAt,
		);

	const totalPrSets = countTotalPrSetsInWorkout(
		toCurrentWorkoutForPr(exercisesToUpdate),
		toPrBaselineSets(historicalSets),
	);

	// TODO: need to make it remove deleted exercises once that feature is in
	await db.workout.update({
		where: { id: id },
		data: {
			name: validWorkout.name,
			durationSeconds: validWorkout.durationSeconds,
			totalVolume,
			totalPrSets,
			exercises: {
				upsert: exercisesToUpdate.map((exercise) => ({
					where: { id: exercise.id },
					// update only existing exercises (have ids)
					update: {
						globalExercise: { connect: { id: exercise.globalExerciseId } },
						difficulty: exercise.difficulty ?? null,
						notes: exercise.notes ?? null,
						sets: {
							deleteMany: {},
							create: exercise.sets.map((set) => ({
								weight: Number(set.weight),
								reps: Number(set.reps),
								completed: set.completed ?? false,
							})),
						},
					},
					// create the new exercises that don't have ids
					create: {
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
					},
				})),
			},
		},
		include: { exercises: { include: { sets: true } } },
	});

	return NextResponse.json({
		success: true,
		workout: validWorkout,
	});
}

export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;

	await db.workout.delete({
		where: { id: id },
	});

	return NextResponse.json({ success: true });
}
