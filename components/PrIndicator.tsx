import { type ReactElement } from "react";

interface PrIndicatorProps {
	pr: number;
}

export default function PrIndicator({ pr }: PrIndicatorProps): ReactElement {
	return (
		<>
		<div className="bg-primary w-fit whitespace-nowrap rounded-sm pl-2 pr-2">
			<span className="text-primary-foreground text-sm font-semibold">
				{pr} PRs
			</span>
		</div>
		</>
	);
}
