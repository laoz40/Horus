import "./Button.css";
import { useNavigate } from "react-router-dom";

interface ButtonProps {
	children: React.ReactNode;
	onClick?: () => void;
	to?: string;
	variant?: "primary" | "secondary" | "danger" | "danger-secondary";
	shape?: "square" | "small";
	icon?: string;
	id: string;
}

const Button = ({
	children,
	onClick,
	to,
	variant,
	shape,
	icon,
	id,
}: ButtonProps) => {
	const navigate = useNavigate();

	const handleClick = () => {
		if (to) {
			navigate(to);
		} else if (onClick) {
      onClick();
		}
	};

	const className = `
		button
		${variant ? `${variant}` : ""}
		${shape ? `${shape}` : ""}
	`.trim();

	return (
		<button
			className={className}
			onClick={handleClick}
			id={id}>
			{icon && <i className="material-icons">{icon}</i>}
			{children}
		</button>
	);
};

export default Button;
