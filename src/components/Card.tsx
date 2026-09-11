import { cn } from "@/lib/utils";

interface CardProps {
	children: React.ReactNode;
	className?: string;
}

export default function Card({ children, className }: CardProps) {
	return (
		<>
			<div
				className={cn(
					"relative mb-3 cursor-pointer rounded-md border bg-card px-3 py-2 shadow-xs hover:bg-accent/60 hover:text-accent-foreground",
					className,
				)}>
				{children}
			</div>
		</>
	);
}
