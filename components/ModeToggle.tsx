"use client";

import { useEffect, useState } from "react";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ModeToggle() {
	const { theme, resolvedTheme, setTheme } = useTheme();
	const [mounted, setMounted] = useState<boolean>(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const activeTheme = theme === "system" ? resolvedTheme : theme;

	const label = !mounted
		? "Theme"
		: activeTheme === "glass"
			? "Glass theme"
			: activeTheme === "dark"
				? "Dark theme"
				: activeTheme === "light"
					? "Light theme"
					: "System theme";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					className="flex items-center gap-2"
					variant="secondary"
					size="sm">
					<span className="relative flex h-[1.2rem] w-[1.2rem] items-center justify-center">
						<Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
						<Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
					</span>
					<span>{label}</span>
					<span className="sr-only">Toggle theme</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onClick={() => setTheme("light")}>
					Light mode
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme("dark")}>
					Dark mode
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme("glass")}>
					Glass mode
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme("system")}>
					System theme
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
