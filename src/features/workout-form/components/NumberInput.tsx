"use client";

import { Input } from "@/components/ui/input";

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
	onClick,
	value,
	...props
}: InputProps) {
	const config = variantConfig[variant];

	const handleBeforeInput = (event: React.FormEvent<HTMLInputElement>) => {
		// React types beforeinput as FormEvent; the native InputEvent carries the inserted text.
		if (!(event.nativeEvent instanceof InputEvent)) return;

		const char = event.nativeEvent.data;

		if (!char) return; // deletion, paste, etc.

		const regex = variant === "integer" ? /^[0-9]$/ : /^[0-9.]$/;

		if (!regex.test(char)) {
			event.preventDefault();
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onChange?.(e);
	};

	const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
		e.currentTarget.select();
		onClick?.(e);
	};

	return (
		<Input
			inputMode={config.inputMode}
			pattern={config.pattern}
			placeholder={placeholder}
			className={className}
			type="text"
			onChange={handleChange}
			onClick={handleClick}
			value={value}
			{...props}
			onBeforeInput={handleBeforeInput}></Input>
	);
}
