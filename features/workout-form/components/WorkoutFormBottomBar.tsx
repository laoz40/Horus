import { type ReactElement } from "react";

import { AlertDialogDestructive } from "@/components/DeleteWorkoutDialog";
import { Button } from "@/components/ui/button";

import ExerciseSelector from "./ExerciseSelector";

interface WorkoutFormBottomBarProps {
	show: boolean;
	exercises: { id: string }[];
	selectedExerciseId?: string;
	isEditingSelectedExercise: boolean;
	onSelectExercise: (value: string) => void;
	onAddExercise: () => void;
	onDeleteExercise: () => void;
	onToggleEdit: () => void;
}

export default function WorkoutFormBottomBar({
	show,
	exercises,
	selectedExerciseId,
	isEditingSelectedExercise,
	onSelectExercise,
	onAddExercise,
	onDeleteExercise,
	onToggleEdit,
}: WorkoutFormBottomBarProps): ReactElement | null {
	if (!show) return null;

	const canToggleEdit = Boolean(selectedExerciseId);
	const addOrDelete = isEditingSelectedExercise ? (
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
					<ExerciseSelector
						exercises={exercises}
						selectedExerciseId={selectedExerciseId}
						onValueChange={onSelectExercise}
					/>
				</div>
				<div className="flex items-center gap-3">
					<Button
						variant={isEditingSelectedExercise ? "default" : "outline"}
						className={isEditingSelectedExercise ? "flex-1" : "flex-1 text-muted-foreground"}
						type="button"
						disabled={!canToggleEdit}
						onClick={onToggleEdit}>
						{isEditingSelectedExercise ? "Done" : "Edit"}
					</Button>
					{addOrDelete}
				</div>
			</div>
		</div>
	);
}
