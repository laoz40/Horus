export interface WorkoutHistoryItem {
	id: string;
	createdAt: number;
	name: string;
	durationSeconds: number | null;
	totalVolume: number;
	totalPrSets: number;
	exerciseCount: number;
	muscleGroups: string[];
}
