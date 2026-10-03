import type { ReactElement, ReactNode } from "react";

interface ProgressExerciseDetailCardProps {
	title: string;
	children: ReactNode;
}

export default function ProgressExerciseDetailCard({
	title,
	children,
}: ProgressExerciseDetailCardProps): ReactElement {
	return (
		<section className="mb-6 flex flex-col">
			<h2 className="mb-1 text-muted-foreground">{title}</h2>
			<div className="rounded-md border bg-card px-3 pt-3 pb-0">{children}</div>
		</section>
	);
}
