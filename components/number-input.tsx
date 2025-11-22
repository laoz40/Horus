"use client";

import { Input } from "./ui/input";

type InputVariant = "decimal" | "integer";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	variant?: InputVariant;
}

const variantConfig = {
	integer: {
		inputMode: "numeric" as const,
		pattern: "[0-9]*" as const,
	},
	decimal: {
		inputMode: "decimal" as const,
		pattern: "[0-9]*[.]?[0-9]*" as const,
	},
} as const;

export default function NumberInput({
	variant = "integer",
	placeholder,
	className,
	value,
	onChange,
}: InputProps) {
	const config = variantConfig[variant];

	const handleChange = (input: React.ChangeEvent<HTMLInputElement>) => {
		if (input.target.validity.patternMismatch) {
			return;
		}
		if (onChange) onChange(input);
	};

	return (
		<Input
			inputMode={config.inputMode}
			pattern={config.pattern}
			placeholder={placeholder}
			className={className}
			type="text"
			value={value}
			onChange={handleChange}></Input>
	);
}
