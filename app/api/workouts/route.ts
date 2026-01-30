import { NextResponse } from "next/server";
import { WorkoutFormData } from "@/lib/types";
import { db } from "@/lib/prisma";
import { normalizeExerciseName, parseWorkout } from "@/lib/convertWorkoutData";
import { Exercise, validateWorkout } from "@/lib/validateWorkout";
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

	await db.workout.create({
		data: {
			name: validWorkout.name,
			durationSeconds: validWorkout.durationSeconds,
			exercises: {
				create: exercisesToCreate.map((exercise) => ({
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
