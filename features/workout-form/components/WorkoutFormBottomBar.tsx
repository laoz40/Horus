import { type ReactElement } from "react";

import { AlertDialogDestructive } from "@/components/DeleteWorkoutDialog";
import { Button } from "@/components/ui/button";
import {
	toggleExerciseEdit,
	useWorkoutFormUiStore,
} from "@/features/workout-form/stores/workoutFormUiStore";

import ExerciseSelector from "./ExerciseSelector";

interface WorkoutFormBottomBarProps {
	exerciseIds: string[];
	onAddExercise: () => void;
	onDeleteExercise: () => void;
}

export default function WorkoutFormBottomBar({
	exerciseIds,
	onAddExercise,
	onDeleteExercise,
}: WorkoutFormBottomBarProps): ReactElement | null {
	const selectedExerciseId = useWorkoutFormUiStore((state) => state.selectedExerciseId);
	const isEditing = useWorkoutFormUiStore((state) => state.isEditing);

	const show = exerciseIds.length > 0;
	if (!show) return null;

	const canToggleEdit = Boolean(selectedExerciseId);
	const addOrDelete = isEditing ? (
		<div className="flex-1">
			<AlertDialogDestructive
				handleDelete={onDeleteExercise}
				title="Delete exercise?"
				description="This will permanently delete the exercise.">
				<Button
					variant="destructive"
					className="w-full"
					type="button">
					Delete Exercise
				</Button>
			</AlertDialogDestructive>
		</div>
	) : (
		<Button
			variant="default"
			className="flex-1"
			type="button"
			onClick={onAddExercise}>
			Add Exercise
		</Button>
	);

	return (
		<div className="ios-safe-area-bottom relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen border-t bg-sidebar dark:bg-sidebar glass:backdrop-blur-xs">
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-4">
				<div className="flex items-center justify-start">
					<ExerciseSelector exerciseIds={exerciseIds} />
				</div>
				<div className="flex items-center gap-3">
					<Button
						variant={isEditing ? "default" : "outline"}
						className={isEditing ? "flex-1" : "flex-1 text-muted-foreground"}
						type="button"
						disabled={!canToggleEdit}
						onClick={toggleExerciseEdit}>
						{isEditing ? "Done" : "Edit"}
					</Button>
					{addOrDelete}
				</div>
			</div>
		</div>
	);
}
