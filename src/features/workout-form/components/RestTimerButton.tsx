"use client";

import { useEffect, useState, type ReactElement } from "react";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { showRestTimerNotification } from "@/features/settings/lib/restTimerNotifications";
import {
	finishRestTimer,
	selectIsRestTimerDrawerOpen,
	selectRestTimerStartedAtMs,
	setRestTimerDrawerOpen,
	useWorkoutFormUiStore,
} from "@/features/workout-form/stores/workoutFormUiStore";

const formatElapsedTime = (elapsedMs: number): string => {
	const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;

	return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

const REST_TARGET_MS = 2 * 60 * 1000; // 2 minutes

const REST_TARGET_REMINDER_INTERVAL_MS = 30 * 1000; // 30 seconds

export default function RestTimerButton(): ReactElement {
	const isOpen = useWorkoutFormUiStore(selectIsRestTimerDrawerOpen);
	const startedAtMs = useWorkoutFormUiStore(selectRestTimerStartedAtMs);
	const [nowMs, setNowMs] = useState(() => Date.now());

	// Update the rest clock and send due reminders while the timer is running.
	useEffect(() => {
		if (!startedAtMs) return;

		let nextAutoOpenMs = startedAtMs + REST_TARGET_MS;

		const tick = () => {
			const currentTimeMs = Date.now();
			setNowMs(currentTimeMs);

			if (currentTimeMs < nextAutoOpenMs) return;

			setRestTimerDrawerOpen(true);
			void showRestTimerNotification(formatElapsedTime(currentTimeMs - startedAtMs));

			// ensure next auto-open time is in the future
			while (nextAutoOpenMs <= currentTimeMs) {
				nextAutoOpenMs += REST_TARGET_REMINDER_INTERVAL_MS;
			}
		};

		tick();
		const intervalId = window.setInterval(tick, 1000);

		return () => window.clearInterval(intervalId);
	}, [startedAtMs]);

	if (!startedAtMs) return <></>;

	const elapsedMs = nowMs - startedAtMs;
	const elapsedTime = formatElapsedTime(elapsedMs);
	const isOverRestTarget = elapsedMs >= REST_TARGET_MS;

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
				className="top-2/3 h-auto w-fit -translate-y-1/2 rounded-r-lg border border-l-0">
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
