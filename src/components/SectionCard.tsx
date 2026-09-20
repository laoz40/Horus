import { cn } from "@/lib/utils";

interface SectionProps extends React.HTMLAttributes<HTMLDivElement> {
	header: string;
	children: React.ReactNode;
	className?: string;
}

function Section({ header, children, className }: SectionProps) {
	return (
		<section className="mb-3 flex flex-col pr-4 pl-4">
			<h2 className="mb-1 text-sm text-muted-foreground">{header}</h2>
			<div className={cn("rounded-md border bg-card p-2", className)}>{children}</div>
		</section>
	);
}

export default Section;
