"use client";

import { useRouter } from "next/navigation";
import { createContext, use } from "react";

export const WorkoutPageExitContext = createContext<((href: string) => void) | null>(null);

export function useWorkoutPageExit(): (href: string) => void {
	const router = useRouter();
	const animateExit = use(WorkoutPageExitContext);

	return (href: string) => {
		if (animateExit) {
			animateExit(href);

			return;
		}

		router.push(href);
	};
}
