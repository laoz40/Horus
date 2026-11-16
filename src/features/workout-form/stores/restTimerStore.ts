import { createStore } from "zustand";
import { clock } from "@/lib/clock";
import { showRestTimerNotification } from "@/features/settings/lib/restTimerNotifications";
import { REST_TARGET_MS, formatRestElapsedTime } from "@/features/workout-form/lib/restTimer";

const REST_TARGET_REMINDER_INTERVAL_MS = 30 * 1000;

type RestTimerState =
	| { state: "idle" }
	| { state: "expanded"; startedAtMs: number }
	| { state: "collapsed"; startedAtMs: number };

type RestTimerStoreState = {
	restTimer: RestTimerState;
	actions: {
		startRestTimer: () => void;
		setRestTimerDrawerOpen: (open: boolean) => void;
		finishRestTimer: () => void;
	};
};

export const createRestTimerStore = () => {
	let stopReminders: (() => void) | undefined;

	return createStore<RestTimerStoreState>()((set, get) => ({
		restTimer: { state: "idle" },
		actions: {
			startRestTimer: () => {
				stopReminders?.();
				const startedAtMs = Date.now();
				let nextReminderAtMs = startedAtMs + REST_TARGET_MS;
				set({ restTimer: { state: "expanded", startedAtMs } });

				stopReminders = clock.subscribe(() => {
					const nowMs = clock.getSnapshot();

					if (nowMs < nextReminderAtMs) return;

					get().actions.setRestTimerDrawerOpen(true);
					void showRestTimerNotification(formatRestElapsedTime(nowMs - startedAtMs));

					while (nextReminderAtMs <= nowMs) {
						nextReminderAtMs += REST_TARGET_REMINDER_INTERVAL_MS;
					}
				});
			},
			setRestTimerDrawerOpen: (open) =>
				set((state) => {
					const { restTimer } = state;

					if (restTimer.state === "idle") return state;

					return {
						restTimer: {
							state: open ? "expanded" : "collapsed",
							startedAtMs: restTimer.startedAtMs,
						},
					};
				}),
			finishRestTimer: () => {
				stopReminders?.();
				stopReminders = undefined;
				set({ restTimer: { state: "idle" } });
			},
		},
	}));
};

export type RestTimerStore = ReturnType<typeof createRestTimerStore>;
