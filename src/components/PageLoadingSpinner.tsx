import { IconLoader2 } from "@tabler/icons-react";

import { cn } from "@/lib/utils";

interface PageLoadingSpinnerProps {
	label: string;
	className?: string;
}

export default function PageLoadingSpinner({ label, className }: PageLoadingSpinnerProps) {
	return (
		<div
			className={cn(
				"flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground",
				className,
			)}>
			<IconLoader2
				className="size-6 animate-spin"
				aria-label={label}
			/>
			<span className="text-sm">{label}</span>
		</div>
	);
}
