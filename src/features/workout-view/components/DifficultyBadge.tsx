import type { ReactElement } from "react";

import { Badge } from "@/components/ui/badge";
import { getDifficultyLevel } from "@/features/workout-form/lib/difficulty";
import { cn } from "@/lib/utils";

interface DifficultyBadgeProps {
	difficulty: number | null | undefined;
}

export default function DifficultyBadge({ difficulty }: DifficultyBadgeProps): ReactElement | null {
	const level = getDifficultyLevel(difficulty);

	if (!level) {
		return null;
	}

	return (
		<Badge
			variant="secondary"
			className={cn("rounded-sm border-0 px-1.5 py-0 text-xs font-medium", level.className)}>
			{level.label}
		</Badge>
	);
}
