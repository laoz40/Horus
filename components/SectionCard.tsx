import { cn } from "@/lib/utils";

interface SectionProps extends React.HTMLAttributes<HTMLDivElement> {
	header: string;
	children: React.ReactNode;
	className?: string;
}

function Section({ header, children, className }: SectionProps) {
	return (
		<section className="flex flex-col pr-4 pl-4 mb-3">
			<h2 className="text-muted-foreground mb-1 text-sm">{header}</h2>
			<div
				className={cn(
					"p-2 border rounded-md bg-card",
					className,
				)}>
				{children}
			</div>
		</section>
	);
}
export default Section;
