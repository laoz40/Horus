import { useSyncExternalStore } from "react";
import { clock } from "@/lib/clock";
import { REST_TARGET_MS, formatRestElapsedTime } from "@/features/workout-form/lib/restTimer";
import { useStore } from "zustand";
import type { RestTimerStore } from "@/features/workout-form/stores/restTimerStore";

export function useRestTimer({ restTimerStore }: { restTimerStore: RestTimerStore }) {
	const startedAtMs = useStore(restTimerStore, (state) =>
		state.restTimer.state === "idle" ? null : state.restTimer.startedAtMs,
	);

	const nowMs = useSyncExternalStore(clock.subscribe, clock.getSnapshot, clock.getServerSnapshot);

	if (!startedAtMs) return null;

	const elapsedMs = nowMs - startedAtMs;

	return {
		elapsedTime: formatRestElapsedTime(elapsedMs),
		isOverRestTarget: elapsedMs >= REST_TARGET_MS,
	};
}
