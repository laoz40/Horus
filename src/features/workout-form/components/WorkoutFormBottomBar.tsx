import { IconHistory } from "@tabler/icons-react";
import { type ReactElement } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { AlertDialogDestructive } from "@/components/DeleteWorkoutDialog";
import { Button } from "@/components/ui/button";
import type { Workout } from "@/features/workout-form/lib/validateWorkout";
import {
	openRecentSetsDialog,
	toggleExerciseEdit,
	useWorkoutFormUiStore,
} from "@/features/workout-form/stores/workoutFormUiStore";

import ExerciseSelector from "@/features/workout-form/components/ExerciseSelector";

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
	const { control } = useFormContext<Workout>();
	const selectedExerciseId = useWorkoutFormUiStore((state) => state.selectedExerciseId);
	const isEditing = useWorkoutFormUiStore((state) => state.isEditing);

	const selectedExerciseIndex = exerciseIds.findIndex(
		(exerciseId) => exerciseId === selectedExerciseId,
	);

	const exerciseNames = useWatch({
		control,
		name: exerciseIds.map((_, exerciseIndex) => `exercises.${exerciseIndex}.global.name` as const),
	});

	const selectedExerciseName =
		selectedExerciseIndex >= 0 ? (exerciseNames[selectedExerciseIndex]?.trim() ?? "") : "";

	const show = exerciseIds.length > 0;

	if (!show) return null;

	const canToggleEdit = Boolean(selectedExerciseId);

	const addOrDelete = isEditing ? (
		<div className="w-full">
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
			className="w-full"
			type="button"
			onClick={onAddExercise}>
			Add Exercise
		</Button>
	);

	return (
		<div className="ios-safe-area-bottom relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen border-t bg-sidebar dark:bg-sidebar">
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-4">
				<div className="flex items-center gap-2">
					<div className="min-w-0 flex-1">
						<ExerciseSelector exerciseIds={exerciseIds} />
					</div>
					<Button
						variant="outline"
						size="icon"
						type="button"
						className="shrink-0"
						disabled={!selectedExerciseName}
						onClick={() => openRecentSetsDialog(selectedExerciseName)}
						aria-label="Recent sets">
						<IconHistory />
					</Button>
				</div>
				<div className="grid grid-cols-2 items-center gap-3">
					<Button
						variant={isEditing ? "default" : "outline"}
						className="w-full"
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
