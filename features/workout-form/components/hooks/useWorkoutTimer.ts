import { useEffect, useState } from "react";

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

	useEffect(() => {
		const interval = setInterval(() => {
			setDurationSeconds((prev) => prev + 1);
		}, 1000);

		return () => {
			clearInterval(interval);
		};
	}, []);

	return { durationSeconds };
};
