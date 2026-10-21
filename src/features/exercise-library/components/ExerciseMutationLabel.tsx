import { IconLoader2 } from "@tabler/icons-react";

interface ExerciseMutationLabelProps {
	isPending: boolean;
	label: string;
	pendingLabel: string;
}

export default function ExerciseMutationLabel({
	isPending,
	label,
	pendingLabel,
}: ExerciseMutationLabelProps) {
	if (isPending) {
		return (
			<>
				<IconLoader2
					className="size-4 animate-spin"
					aria-hidden
				/>
				{pendingLabel}
			</>
		);
	}

	return label;
}
