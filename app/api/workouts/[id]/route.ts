import { normalizeExerciseName, parseWorkout } from "@/lib/convertWorkoutData";
import { db } from "@/lib/prisma";
import { WorkoutFormData } from "@/lib/types";
import { Exercise, validateWorkout } from "@/lib/validateWorkout";
import { NextResponse } from "next/server";
import { fromZodError } from "zod-validation-error";

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

	const getGlobalExerciseId = async (exercise: Exercise): Promise<string> => {
		if (exercise.global.name) {
			const normalizedName = normalizeExerciseName(exercise.global.name);
			const existingExercise = await db.globalExercise.findUnique({
				where: { normalizedName },
			});

			// check if it already exists, return id
			if (existingExercise) {
				// update muscle groups if they don't exist
				if (
					existingExercise.muscleGroups == null &&
					exercise.global.muscleGroups?.length
				) {
					await db.globalExercise.update({
						where: { id: existingExercise.id },
						data: { muscleGroups: exercise.global.muscleGroups },
					});
				}
				return existingExercise.id;
			}

			// else create new global exercise
			const createNew = await db.globalExercise.create({
				data: {
					name: exercise.global.name,
					normalizedName,
					muscleGroups: exercise.global.muscleGroups,
				},
			});
			return createNew.id;
		}
		throw new Error("exerciseId or newExerciseName missing");
	};

	const exercisesToUpdate = await Promise.all(
		validWorkout.exercises.map(async (exercise) => {
			const globalExerciseId = await getGlobalExerciseId(exercise);

			return {
				id: exercise.id,
				globalExerciseId,
				difficulty: exercise.difficulty ?? null,
				notes: exercise.notes ?? null,
				sets: exercise.sets,
			};
		}),
	);

	// TODO: need to make it remove deleted exercises once that feature is in
	await db.workout.update({
		where: { id: id },
		data: {
			name: validWorkout.name,
			durationSeconds: validWorkout.durationSeconds,
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
