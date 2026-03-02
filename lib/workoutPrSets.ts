import { db } from "@/lib/prisma";
import { type ExerciseWithGlobalId } from "@/lib/globalExercise";

interface PreviousSetRecord {
	weight: number;
	reps: number;
	completed: boolean;
	exercise: {
		globalExerciseId: string;
	};
}

export const getTargetGlobalExerciseIds = (
	exercises: ExerciseWithGlobalId[],
): string[] => {
	return [...new Set(exercises.map((exercise) => exercise.globalExerciseId))];
};

export const getPreviousCompletedSetsByGlobalExerciseIds = async (
	globalExerciseIds: string[],
): Promise<PreviousSetRecord[]> => {
	return db.set.findMany({
		where: {
			completed: true,
			exercise: {
				globalExerciseId: {
					in: globalExerciseIds,
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
};

export const getHistoricalCompletedSetsByGlobalExerciseIdsBeforeDate = async (
	globalExerciseIds: string[],
	before: Date,
): Promise<PreviousSetRecord[]> => {
	return db.set.findMany({
		where: {
			completed: true,
			exercise: {
				globalExerciseId: {
					in: globalExerciseIds,
				},
				workout: {
					createdAt: {
						lt: before,
					},
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
};

export const toCurrentWorkoutForPr = (exercises: ExerciseWithGlobalId[]) => {
	return {
		exercises: exercises.map((exercise) => ({
			globalExerciseId: exercise.globalExerciseId,
			sets: exercise.sets.map((set) => ({
				weight: Number(set.weight) || 0,
				reps: Number(set.reps) || 0,
				completed: set.completed ?? false,
			})),
		})),
	};
};

export const toPrBaselineSets = (previousSets: PreviousSetRecord[]) => {
	return previousSets.map((set) => ({
		globalExerciseId: set.exercise.globalExerciseId,
		weight: set.weight,
		reps: set.reps,
		completed: set.completed,
	}));
};
