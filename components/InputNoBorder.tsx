import { cn } from "@/lib/utils";
import { type ReactElement } from "react";

interface InputNoBorderProps extends React.InputHTMLAttributes<HTMLInputElement> {
	placeholder: string;
}

export default function InputNoBorder({
	placeholder,
	className,
	...props

}: InputNoBorderProps): ReactElement {
	return (
		<>
			<input
				type="text"
				placeholder={placeholder}
				className={cn("bg-transparent border-0 outline-0 focus:outline-0 focus:ring-0 focus-visible:outline-0 focus-visible:ring-0", className)}
				{...props}
			/>
		</>
	);
}
