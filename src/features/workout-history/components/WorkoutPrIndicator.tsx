import { IconTrophyFilled } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export default function WorkoutPrIndicator({
	pr,
	isPrPending,
}: {
	pr: number;
	isPrPending: boolean;
}) {
	if (isPrPending) {
		return (
			<div
				aria-hidden
				className="h-4 w-8 animate-pulse rounded-sm bg-muted"
			/>
		);
	}

	let displayCount = 0;

	if (pr > 0) {
		displayCount = pr;
	}

	return (
		<div
			className={cn("flex items-center gap-1", pr === 0 && "invisible")}
			aria-hidden={pr === 0}>
			<IconTrophyFilled className="size-4 shrink-0 text-primary" />
			<span className="relative top-px text-xs leading-none font-medium whitespace-nowrap text-primary">
				{pr > 0 && <span className="sr-only">Personal records:</span>}
				{displayCount}
			</span>
		</div>
	);
}
