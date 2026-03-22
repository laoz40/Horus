import { useCallback, useEffect, useState } from "react";

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
	const getElapsedSeconds = useCallback(
		() => Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000)),
		[startedAtMs],
	);
	const [durationSeconds, setDurationSeconds] = useState<number>(initialDurationSeconds);

	useEffect(() => {
		setDurationSeconds(initialDurationSeconds);
	}, [initialDurationSeconds]);

	useEffect(() => {
		const updateDuration = () => {
			setDurationSeconds(getElapsedSeconds());
		};

		updateDuration();

		const interval = window.setInterval(() => {
			updateDuration();
		}, 1000);

		return () => {
			window.clearInterval(interval);
		};
	}, [getElapsedSeconds]);

	return { durationSeconds };
};
