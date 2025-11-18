"use client";

import { useState } from "react";
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

export default function NumberInput({ variant = "integer", placeholder, className }: InputProps) {
	const config = variantConfig[variant];

	const [value, setValue] = useState("");

	const handleChange = (input: React.ChangeEvent<HTMLInputElement>) => {
		const inputValue = input.target;
		if (inputValue.validity.patternMismatch) {
			return;
		}
		setValue(inputValue.value);
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
