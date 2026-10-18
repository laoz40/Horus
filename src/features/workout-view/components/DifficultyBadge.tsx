import type { ReactElement } from "react";

import { Badge } from "@/components/ui/badge";
import { getDifficultyLevel } from "@/features/workout-view/lib/difficulty";
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
			className={cn(
				"border-0 px-1.5 py-0",
				level.value === 0 && "bg-muted text-muted-foreground",
				level.value === 2 && "bg-chart-4/15 text-chart-4",
				level.value === 3 && "bg-challenging/15 text-challenging",
				level.value === 4 && "bg-destructive/10 text-destructive",
			)}>
			{level.label}
		</Badge>
	);
}
