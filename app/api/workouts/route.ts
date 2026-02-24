import { NextResponse } from "next/server";
import { WorkoutFormData } from "@/features/workout-form/lib/types";
import { db } from "@/lib/prisma";
import {
	normalizeExerciseName,
	parseWorkout,
} from "@/features/workout-form/lib/convertWorkoutData";
import {
	Exercise,
	validateWorkout,
} from "@/features/workout-form/lib/validateWorkout";
import {
	countTotalPrSetsInWorkout,
	calculateWorkoutVolume,
} from "@/lib/calculateWorkoutStats";
import { fromZodError } from "zod-validation-error";

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

	const getGlobalExerciseId = async (exercise: Exercise): Promise<string> => {
		if (exercise.global.name) {
			const normalizedName = normalizeExerciseName(exercise.global.name);
			const existingExercise = await db.globalExercise.findUnique({
				where: { normalizedName },
			});

			// check if it already exists, return id
			if (existingExercise) {
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

	const exercisesToCreate = await Promise.all(
		validWorkout.exercises.map(async (exercise) => {
			const globalExerciseId = await getGlobalExerciseId(exercise);

			return {
				globalExerciseId: globalExerciseId,
				difficulty: exercise.difficulty ?? null,
				notes: exercise.notes ?? null,
				sets: exercise.sets,
			};
		}),
	);

	const targetExerciseIds = [
		...new Set(exercisesToCreate.map((exercise) => exercise.globalExerciseId)),
	];

	const previousSets = await db.set.findMany({
		where: {
			completed: true,
			exercise: {
				globalExerciseId: {
					in: targetExerciseIds,
				},
			},
		},
		select: {
			weight: true,
			reps: true,
			completed: true,
			exercise: {
				select: {
					globalExerciseId: true,
				},
			},
		},
	});

	const totalVolume = calculateWorkoutVolume(validWorkout);
	const totalPrSets = countTotalPrSetsInWorkout(
		// current workout
		{
			exercises: exercisesToCreate.map((exercise) => ({
				globalExerciseId: exercise.globalExerciseId,
				sets: exercise.sets.map((set) => ({
					weight: Number(set.weight) || 0,
					reps: Number(set.reps) || 0,
					completed: set.completed ?? false,
				})),
			})),
		},
		// previous sets
		previousSets.map((set) => ({
			globalExerciseId: set.exercise.globalExerciseId,
			weight: set.weight,
			reps: set.reps,
			completed: set.completed,
		})),
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
