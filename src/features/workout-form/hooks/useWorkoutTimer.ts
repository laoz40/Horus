import { useEffect, useState } from "react";

interface UseWorkoutTimerOptions {
	initialDurationSeconds: number;
	startedAtMs: number;
}

interface UseWorkoutTimerReturn {
	durationSeconds: number;
}

export const useWorkoutTimer = ({
	initialDurationSeconds,
	startedAtMs,
}: UseWorkoutTimerOptions): UseWorkoutTimerReturn => {
	const [durationSeconds, setDurationSeconds] = useState<number>(initialDurationSeconds);

	// Update elapsed time from the session start immediately and every second.
	useEffect(() => {
		const updateDuration = () => {
			setDurationSeconds(Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000)));
		};

		updateDuration();

		const interval = window.setInterval(() => {
			updateDuration();
		}, 1000);

		return () => {
			window.clearInterval(interval);
		};
	}, [startedAtMs]);

	return { durationSeconds };
};
