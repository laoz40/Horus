"use client";

import { IconLoader2 } from "@tabler/icons-react";

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
} from "@/features/settings/lib/exerciseMergeDialog";

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
						onClick={onCombine}>
						{isCombining ? (
							<>
								<IconLoader2
									className="size-4 animate-spin"
									aria-hidden
								/>
								Combining
							</>
						) : (
							"Combine"
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
