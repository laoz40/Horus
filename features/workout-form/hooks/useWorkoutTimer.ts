import { useEffect, useRef, useState } from "react";

interface UseWorkoutTimerOptions {
	initialSeconds?: number;
}

interface UseWorkoutTimerReturn {
	durationSeconds: number;
}

export const useWorkoutTimer = ({
	initialSeconds = 0,
}: UseWorkoutTimerOptions): UseWorkoutTimerReturn => {
	const [durationSeconds, setDurationSeconds] = useState(initialSeconds);
	const startTimeMs = useRef<number>(Date.now() - initialSeconds * 1000);

	useEffect(() => {
		const updateDuration = () => {
			const elapsedSeconds = Math.floor((Date.now() - startTimeMs.current) / 1000);
			setDurationSeconds(elapsedSeconds);
		};

		updateDuration();

		const interval = setInterval(() => {
			updateDuration();
		}, 1000);

		return () => {
			clearInterval(interval);
		};
	}, []);

	return { durationSeconds };
};
