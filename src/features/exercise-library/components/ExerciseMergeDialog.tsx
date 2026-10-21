"use client";

import ExerciseMutationLabel from "@/features/exercise-library/components/ExerciseMutationLabel";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	getExerciseMergeDialogDescription,
	getExerciseMergeDialogLead,
} from "@/features/exercise-library/lib/exerciseMergeDialog";

interface ExerciseMergeDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	sourceName: string;
	targetName: string;
	sourceWorkoutCount: number;
	kind: "create" | "edit";
	onCombine: () => void;
	isCombining: boolean;
}

export default function ExerciseMergeDialog({
	open,
	onOpenChange,
	sourceName,
	targetName,
	sourceWorkoutCount,
	kind,
	onCombine,
	isCombining,
}: ExerciseMergeDialogProps) {
	return (
		<AlertDialog
			open={open}
			onOpenChange={onOpenChange}>
			<AlertDialogContent size="sm">
				<AlertDialogHeader>
					<AlertDialogTitle>Combine exercises?</AlertDialogTitle>
					<AlertDialogDescription className="text-balance">
						{getExerciseMergeDialogLead(sourceName, targetName)}
					</AlertDialogDescription>
					<AlertDialogDescription className="text-balance">
						{getExerciseMergeDialogDescription({
							targetName,
							sourceWorkoutCount,
							kind,
						})}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isCombining}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						disabled={isCombining}
						onClick={(event) => {
							// Keep confirmation visible while combining and after a failed request.
							event.preventDefault();
							onCombine();
						}}>
						<ExerciseMutationLabel
							isPending={isCombining}
							label="Combine"
							pendingLabel="Combining"
						/>
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
