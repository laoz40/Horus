import { AlertDialogDestructive } from "@/components/DeleteWorkoutDialog";
import { Button } from "@/components/ui/button";

interface ExerciseActionButtonProps {
	isEditing: boolean;
	onAddExercise: () => void;
	onDeleteExercise: () => void;
}

export default function ExerciseActionButton({
	isEditing,
	onAddExercise,
	onDeleteExercise,
}: ExerciseActionButtonProps) {
	if (isEditing) {
		return (
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
		);
	}

	return (
		<Button
			variant="default"
			className="w-full"
			type="button"
			onClick={onAddExercise}>
			Add Exercise
		</Button>
	);
}
