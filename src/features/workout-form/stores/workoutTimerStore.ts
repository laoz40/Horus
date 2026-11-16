import { create } from "zustand";

type WorkoutTimerStore = {
	startedAtMs: number;
	actions: {
		start: (initialDurationSeconds?: number) => void;
	};
};

export const useWorkoutTimerStore = create<WorkoutTimerStore>()((set) => ({
	startedAtMs: Date.now(),
	actions: {
		start: (initialDurationSeconds = 0) =>
			set({ startedAtMs: Date.now() - Math.max(0, initialDurationSeconds) * 1000 }),
	},
}));
