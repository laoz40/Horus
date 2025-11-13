interface SectionProps {
	header: string;
	children: React.ReactNode;
}

function Section({ header, children }: SectionProps) {
	return (
		<section className="flex flex-col pr-4 pl-4 mb-3">
			<h2 className="text-muted-foreground">{header}</h2>
			{children}
		</section>
	);
}
export default Section;
