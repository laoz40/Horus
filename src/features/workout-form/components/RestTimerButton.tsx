"use client";

import type { ReactElement } from "react";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { useRestTimer } from "@/features/workout-form/hooks/useRestTimer";
import {
	finishRestTimer,
	selectIsRestTimerDrawerOpen,
	setRestTimerDrawerOpen,
	useWorkoutFormUiStore,
} from "@/features/workout-form/stores/workoutFormUiStore";

export default function RestTimerButton(): ReactElement {
	const isOpen = useWorkoutFormUiStore(selectIsRestTimerDrawerOpen);
	const timer = useRestTimer();

	if (!timer) return <></>;

	const { elapsedTime, isOverRestTarget } = timer;

	return (
		<Drawer
			direction="left"
			noBodyStyles
			open={isOpen}
			onOpenChange={setRestTimerDrawerOpen}>
			<DrawerTrigger asChild>
				<Button
					className={cn(
						"absolute top-2/3 -left-5 z-50 -translate-y-1/2 rotate-270 rounded-none rounded-b-md border-t-0 font-semibold tabular-nums shadow-sm",
						isOverRestTarget && "text-destructive hover:text-destructive",
					)}
					variant="outline">
					{elapsedTime}
				</Button>
			</DrawerTrigger>
			<DrawerContent
				aria-describedby={undefined}
				className="top-2/3 h-auto w-fit -translate-y-1/2 rounded-r-lg border border-l-0 data-[state=open]:animation-duration-250! motion-reduce:data-[state=open]:animate-none!">
				<DrawerHeader className="text-center">
					<DrawerTitle>Rest Timer</DrawerTitle>
				</DrawerHeader>
				<div
					className={cn(
						"mb-4 text-center text-4xl font-semibold text-foreground tabular-nums",
						isOverRestTarget && "text-destructive",
					)}>
					{elapsedTime}
				</div>
				<Button
					variant={isOverRestTarget ? "destructive" : "outline"}
					className="w-fit px-12"
					onClick={finishRestTimer}>
					Finish Rest
				</Button>
			</DrawerContent>
		</Drawer>
	);
}
