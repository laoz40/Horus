"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
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
const REST_TARGET_REMINDER_INTERVAL_MS = 15 * 1000; // 15 seconds

const requestRestTimerNotificationPermission = async (): Promise<void> => {
	if (!("Notification" in window)) return;

	if (Notification.permission !== "default") return;

	await Notification.requestPermission();
};

const showRestTimerNotification = (elapsedTime: string): void => {
	if (!("Notification" in window)) return;

	if (Notification.permission !== "granted") return;

	new Notification("Rest timer", {
		body: `${elapsedTime} rest elapsed. Time for your next set.`,
	});
};

export default function RestTimerButton(): ReactElement {
	const isOpen = useWorkoutFormUiStore(selectIsRestTimerDrawerOpen);
	const startedAtMs = useWorkoutFormUiStore(selectRestTimerStartedAtMs);
	const [nowMs, setNowMs] = useState(() => Date.now());
	const nextAutoOpenMsRef = useRef<number | null>(null);

	useEffect(() => {
		nextAutoOpenMsRef.current = startedAtMs ? startedAtMs + REST_TARGET_MS : null;

		if (!startedAtMs) return;

		setNowMs(Date.now());
		void requestRestTimerNotificationPermission();
		const intervalId = window.setInterval(() => {
			setNowMs(Date.now());
		}, 1000);

		return () => window.clearInterval(intervalId);
	}, [startedAtMs]);

	useEffect(() => {
		if (!startedAtMs || !nextAutoOpenMsRef.current) return;

		if (nowMs < nextAutoOpenMsRef.current) return;

		setRestTimerDrawerOpen(true);
		void showRestTimerNotification(formatElapsedTime(nowMs - startedAtMs));

		// ensure next auto-open time is in the future
		while (nextAutoOpenMsRef.current <= nowMs) {
			nextAutoOpenMsRef.current += REST_TARGET_REMINDER_INTERVAL_MS;
		}
	}, [nowMs, startedAtMs]);

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
						"absolute -left-5 top-2/3 z-50 -translate-y-1/2 rotate-270 rounded-l-md border border-t-0 text-sm font-semibold tabular-nums shadow-sm",
						isOverRestTarget && "text-destructive hover:text-destructive",
					)}
					variant="outline">
					{elapsedTime}
				</Button>
			</DrawerTrigger>
			<DrawerContent className="top-2/3 h-auto w-fit -translate-y-1/2 rounded-r-lg border border-l-0">
				<DrawerHeader className="text-center">
					<DrawerTitle>Rest Timer</DrawerTitle>
				</DrawerHeader>
				<div
					className={cn(
						"mb-4 text-center text-4xl font-semibold tabular-nums text-foreground",
						isOverRestTarget && "text-destructive",
					)}>
					{elapsedTime}
				</div>
				<Button
					variant={isOverRestTarget ? "destructive" : "outline"}
					className="w-fit px-12"
					onClick={finishRestTimer}>
					FINISH REST
				</Button>
			</DrawerContent>
		</Drawer>
	);
}
