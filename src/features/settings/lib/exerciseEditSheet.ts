import { muscleGroupsToCategories } from "@/features/settings/lib/exerciseCatalogMuscleGroups";
import type { MuscleGroupCategory } from "@/features/workout-form/lib/muscleGroupCategories";

export interface ExerciseCatalogItem {
	id: string;
	name: string;
	muscleGroups: string[];
	workoutCount: number;
}

export type ExerciseEditSheetState =
	| { kind: "closed" }
	| { kind: "create" }
	| { kind: "edit"; exercise: ExerciseCatalogItem };

export type OpenExerciseEditSheetState = Exclude<ExerciseEditSheetState, { kind: "closed" }>;

export function getExerciseEditSheetTitle(state: OpenExerciseEditSheetState): string {
	if (state.kind === "create") {
		return "Add exercise";
	}

	return "Edit exercise";
}

export function getExerciseEditInitialName(state: OpenExerciseEditSheetState): string {
	if (state.kind === "edit") {
		return state.exercise.name;
	}

	return "";
}

export function getExerciseEditInitialCategories(
	state: OpenExerciseEditSheetState,
): MuscleGroupCategory[] {
	if (state.kind === "edit") {
		return muscleGroupsToCategories(state.exercise.muscleGroups);
	}

	return [];
}
