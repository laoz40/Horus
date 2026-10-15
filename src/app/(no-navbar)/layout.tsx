"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode, type ReactElement } from "react";

import { cn } from "@/lib/utils";
import { WorkoutPageExitContext } from "@/lib/workoutPageExit";

export default function NoNavLayout({ children }: { children: ReactNode }): ReactElement {
	const router = useRouter();
	const [exitHref, setExitHref] = useState<string | null>(null);

	return (
		<WorkoutPageExitContext value={setExitHref}>
			<main className="no-scrollbar relative flex min-h-0 w-full flex-1 flex-col overflow-hidden">
				<div
					className={cn(
						"create-workout-page mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col",
						exitHref === null ? "page-slide-up" : "page-slide-down",
					)}
					onAnimationEnd={(event) => {
						if (
							event.target === event.currentTarget &&
							event.animationName === "page-slide-down" &&
							exitHref !== null
						) {
							router.push(exitHref);
						}
					}}>
					{children}
				</div>
			</main>
		</WorkoutPageExitContext>
	);
}
