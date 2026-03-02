import { normalizeExerciseName } from "@/features/workout-form/lib/convertWorkoutData";
import { type Exercise } from "@/features/workout-form/lib/validateWorkout";
import { db } from "@/lib/prisma";

export interface ExerciseWithGlobalId {
	id: string;
	globalExerciseId: string;
	difficulty: number | null;
	notes: string | null;
	sets: Exercise["sets"];
}

export const getOrCreateGlobalExerciseId = async (
	exercise: Exercise,
): Promise<string> => {
	if (exercise.global.name) {
		const normalizedName = normalizeExerciseName(exercise.global.name);
		const existingExercise = await db.globalExercise.findUnique({
			where: { normalizedName },
		});

		if (existingExercise) {
			return existingExercise.id;
		}

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

export const mapExercisesWithGlobalIds = async (
	exercises: Exercise[],
): Promise<ExerciseWithGlobalId[]> => {
	return Promise.all(
		exercises.map(async (exercise) => {
			const globalExerciseId = await getOrCreateGlobalExerciseId(exercise);

			return {
				id: exercise.id,
				globalExerciseId,
				difficulty: exercise.difficulty ?? null,
				notes: exercise.notes ?? null,
				sets: exercise.sets,
			};
		}),
	);
};
