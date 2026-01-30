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
	onChange,
	value,
	...props
}: InputProps) {
	const config = variantConfig[variant];

	const handleBeforeInput = (event: React.FormEvent<HTMLInputElement>) => {
		const e = event as unknown as InputEvent;
		const char = e.data;

		if (!char) return; // deletion, paste, etc.

		const regex = variant === "integer" ? /^[0-9]$/ : /^[0-9.]$/;

		if (!regex.test(char)) {
			event.preventDefault();
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onChange?.(e);
	};

	return (
		<Input
			inputMode={config.inputMode}
			pattern={config.pattern}
			placeholder={placeholder}
			className={className}
			type="text"
			onChange={handleChange}
			value={value}
			{...props}
			onBeforeInput={handleBeforeInput}></Input>
	);
}
