import { readSelectedCategories } from "@/features/exercise-library/lib/exerciseMuscleCategories";
import type { MuscleGroupCategory } from "@/features/exercise-library/lib/muscleGroupCategories";

export interface ExerciseCatalogItem {
	id: string;
	name: string;
	muscleGroups: string[];
	workoutCount: number;
}

export type ExerciseEditSheetState =
	| { state: "closed" }
	| { state: "create" }
	| { state: "edit"; exercise: ExerciseCatalogItem };

export type OpenExerciseEditSheetState = Exclude<ExerciseEditSheetState, { state: "closed" }>;

export function getExerciseEditSheetTitle(sheet: OpenExerciseEditSheetState): string {
	if (sheet.state === "create") {
		return "Add exercise";
	}

	return "Edit exercise";
}

export function getExerciseEditInitialName(sheet: OpenExerciseEditSheetState): string {
	if (sheet.state === "edit") {
		return sheet.exercise.name;
	}

	return "";
}

export function getExerciseEditInitialCategories(
	sheet: OpenExerciseEditSheetState,
): MuscleGroupCategory[] {
	if (sheet.state === "edit") {
		return readSelectedCategories(sheet.exercise.muscleGroups);
	}

	return [];
}
