import { parseUpdatedWorkout } from "@/lib/parseWorkout";
import { db } from "@/lib/prisma";
import { WorkoutFormData } from "@/lib/types";
import { Exercise, validateWorkout } from "@/lib/validateWorkout";
import { NextResponse } from "next/server";

// FIX: doesn't work for created exercises
export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const rawWorkout: WorkoutFormData = await request.json();
	const parsedWorkout = parseUpdatedWorkout(rawWorkout);

	const validationResult = validateWorkout(parsedWorkout);

	if (!validationResult.success) {
		return NextResponse.json({
			success: false,
			errors: validationResult.error,
		});
	}

	const validWorkout = validationResult.data;

	const getGlobalExerciseId = async (
		exercise: Exercise,
	): Promise<string> => {
		if (exercise.exercise.exerciseId) {
			return exercise.exercise.exerciseId;
		}

		throw new Error("exerciseId missing");
	};

	const mapExercises = await Promise.all(
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

	const exercisesToUpdate = mapExercises.filter((exercise) => exercise.id);
	const exercisesToCreate = mapExercises.filter((exercise) => !exercise.id);

	await db.workout.update({
		where: { id: id },
		data: {
			name: validWorkout.name,
			exercises: {
				// update only existing exercises (have ids)
				update: exercisesToUpdate
					.map((exercise) => ({
						where: { id: exercise.id },
						data: {
							globalExercise: { connect: { id: exercise.globalExerciseId } },
							difficulty: exercise.difficulty ?? null,
							notes: exercise.notes ?? null,
							sets: {
								deleteMany: {},
								create: exercise.sets.map((set) => ({
									weight: Number(set.weight),
									reps: Number(set.reps),
								})),
							},
						},
					})),
				// create the new exercises that don't have ids
				create: exercisesToCreate
					.map((exercise) => ({
						globalExercise: { connect: { id: exercise.globalExerciseId } },
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
