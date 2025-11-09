import "./Button.css";

interface ButtonProps {
	children: React.ReactNode;
	onClick?: () => void;
	variant?: "primary" | "secondary" | "danger";
	shape?: "square" | "small";
	icon?: string;
	id: string;
}

const Button = ({
	children,
	onClick,
	variant,
	shape,
	icon,
	id,
}: ButtonProps) => {
	const className = `
		button
		${variant ? `${variant}` : ""}
		${shape ? `${shape}` : ""}
	`.trim();

	return (
		<button
			className={className}
			onClick={onClick}
			id={id}>
			{icon && <i className="material-icons">{icon}</i>}
			{children}
		</button>
	);
};

export default Button;
