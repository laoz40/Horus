import {
	Workout as PrismaWorkout,
	Exercise,
	Set,
	Prisma,
} from "@prisma/client";

export type WorkoutDbData = PrismaWorkout & {
	exercises: (Exercise & {
		sets: Set[];
		globalExercise: {
			id: string;
			name: string;
			normalizedName: string;
			muscleGroups: Prisma.JsonValue | null;
		};
	})[];
};

export type WorkoutWithPrData = WorkoutDbData & {
	totalPrSets: number;
};

export interface WorkoutHistoryItem {
	_id: string;
	_creationTime: number;
	name: string;
	durationSeconds: number | null;
	totalVolume: number;
	totalPrSets: number;
	exerciseCount: number;
	muscleGroups: string[];
}
