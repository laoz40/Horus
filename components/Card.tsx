interface CardProps {
	children: React.ReactNode;
}

export default function Card({ children }: CardProps) {
	return (
		<>
			<div className="relative border bg-card shadow-xs hover:bg-accent/60 hover:text-accent-foreground mb-3 mr-4 ml-4 pt-2 pb-2 pl-3 pr-4 cursor-pointer rounded-md">
				{children}
			</div>
		</>
	);
}
