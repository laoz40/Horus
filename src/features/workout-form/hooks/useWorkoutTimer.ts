import { useSyncExternalStore } from "react";
import { clock } from "@/lib/clock";

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
	const nowMs = useSyncExternalStore(clock.subscribe, clock.getSnapshot, clock.getServerSnapshot);

	if (nowMs === 0) return { durationSeconds: initialDurationSeconds };

	return { durationSeconds: Math.max(0, Math.floor((nowMs - startedAtMs) / 1000)) };
};
