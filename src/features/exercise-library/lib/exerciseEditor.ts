import { readSelectedCategories } from "@/features/exercise-library/lib/exerciseMuscleCategories";
import type { MuscleGroupCategory } from "@/features/exercise-library/lib/muscleGroupCategories";

export interface ExerciseCatalogItem {
	id: string;
	name: string;
	muscleGroups: string[];
	workoutCount: number;
}

export type ExerciseEditorState =
	| { state: "closed" }
	| { state: "create" }
	| { state: "edit"; exercise: ExerciseCatalogItem };

export type OpenExerciseEditorState = Exclude<ExerciseEditorState, { state: "closed" }>;

export function getExerciseEditorTitle(editor: OpenExerciseEditorState): string {
	if (editor.state === "create") {
		return "Add exercise";
	}

	return "Edit exercise";
}

export function getExerciseEditInitialName(editor: OpenExerciseEditorState): string {
	if (editor.state === "edit") {
		return editor.exercise.name;
	}

	return "";
}

export function getExerciseEditInitialCategories(
	editor: OpenExerciseEditorState,
): MuscleGroupCategory[] {
	if (editor.state === "edit") {
		return readSelectedCategories(editor.exercise.muscleGroups);
	}

	return [];
}
