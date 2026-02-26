interface CardProps {
	children: React.ReactNode;
}

export default function Card({ children }: CardProps) {
	return (
		<>
			<div className="relative border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input dark:border-input dark:hover:bg-input glass:bg-input/30 glass:border-input glass:hover:bg-input/50 mb-3 mr-4 ml-4 pt-2 pb-2 pl-3 pr-4 cursor-pointer rounded-md">
				{children}
			</div>
		</>
	);
}
