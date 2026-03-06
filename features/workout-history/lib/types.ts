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
