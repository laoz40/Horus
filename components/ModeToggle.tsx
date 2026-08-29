"use client";

import { useSyncExternalStore } from "react";

import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Reports false on the server snapshot so SSR markup matches the first client render.
const emptySubscribe = () => () => {};

export function ModeToggle() {
	const { theme, resolvedTheme, setTheme } = useTheme();
	const mounted = useSyncExternalStore(
		emptySubscribe,
		() => true,
		() => false,
	);

	const activeTheme = theme === "system" ? resolvedTheme : theme;

	const label = !mounted
		? "Theme"
		: activeTheme === "glass"
			? "Glass"
			: activeTheme === "dark"
				? "Dark"
				: activeTheme === "light"
					? "Light"
					: "System";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					className="flex items-center gap-2"
					variant="secondary"
					size="sm">
					<span className="text-sm">{label}</span>
					<span className="sr-only">Toggle theme</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme("glass")}>Glass</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
