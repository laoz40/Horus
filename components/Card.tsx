interface CardProps {
	children: React.ReactNode;
}

export default function Card({ children }: CardProps) {
	return (
		<>
			<div className="relative border bg-card shadow-xs hover:bg-accent/60 hover:text-accent-foreground mb-3 px-3 py-2 cursor-pointer rounded-md">
				{children}
			</div>
		</>
	);
}
