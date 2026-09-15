import { formatWorkoutCount } from "@/features/settings/lib/formatExerciseCatalog";

interface ExerciseMergeDialogCopyInput {
	targetName: string;
	sourceWorkoutCount: number;
	kind: "create" | "edit";
}

export function getExerciseMergeDialogDescription({
	targetName,
	sourceWorkoutCount,
	kind,
}: ExerciseMergeDialogCopyInput): string {
	if (kind === "create") {
		return `Your muscle groups will be added to ${targetName}.`;
	}

	if (sourceWorkoutCount === 0) {
		return `Muscle groups will be combined onto ${targetName}. Personal records will be recalculated.`;
	}

	return `All ${formatWorkoutCount(sourceWorkoutCount)} will count toward ${targetName}. Personal records will be recalculated.`;
}

export function getExerciseMergeDialogLead(sourceName: string, targetName: string): string {
	return `You already have ${targetName}. Combine ${sourceName} into it?`;
}
