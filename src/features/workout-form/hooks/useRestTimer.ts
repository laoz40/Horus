import { useEffect, useState } from "react";
import { showRestTimerNotification } from "@/features/settings/lib/restTimerNotifications";
import {
	selectRestTimerStartedAtMs,
	setRestTimerDrawerOpen,
	useWorkoutFormUiStore,
} from "@/features/workout-form/stores/workoutFormUiStore";

const REST_TARGET_MS = 2 * 60 * 1000; // 2 minutes

const REST_TARGET_REMINDER_INTERVAL_MS = 30 * 1000; // 30 seconds

const formatElapsedTime = (elapsedMs: number): string => {
	const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;

	return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

export function useRestTimer() {
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

			// Ensure the next auto-open time is in the future.
			while (nextAutoOpenMs <= currentTimeMs) {
				nextAutoOpenMs += REST_TARGET_REMINDER_INTERVAL_MS;
			}
		};

		tick();
		const intervalId = window.setInterval(tick, 1000);

		return () => window.clearInterval(intervalId);
	}, [startedAtMs]);

	if (!startedAtMs) return null;

	const elapsedMs = nowMs - startedAtMs;

	return {
		elapsedTime: formatElapsedTime(elapsedMs),
		isOverRestTarget: elapsedMs >= REST_TARGET_MS,
	};
}
