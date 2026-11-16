import { createStore } from "zustand";
import { clock } from "@/lib/clock";
import { showRestTimerNotification } from "@/features/settings/lib/restTimerNotifications";
import { REST_TARGET_MS, formatRestElapsedTime } from "@/features/workout-form/lib/restTimer";

const REST_TARGET_REMINDER_INTERVAL_MS = 30 * 1000;

type RestTimerState =
	| { state: "idle" }
	| { state: "expanded"; startedAtMs: number }
	| { state: "collapsed"; startedAtMs: number };

type RestTimerEvent =
	| { event: "START_REST_TIMER" }
	| { event: "SET_REST_TIMER_DRAWER_OPEN"; open: boolean }
	| { event: "FINISH_REST_TIMER" };

type RestTimerStoreState = {
	restTimer: RestTimerState;
	send: (event: RestTimerEvent) => void;
};

export const createRestTimerStore = () => {
	let stopReminders: (() => void) | undefined;

	return createStore<RestTimerStoreState>()((set, get) => ({
		restTimer: { state: "idle" },
		send: (event) => {
			switch (event.event) {
				case "START_REST_TIMER": {
					stopReminders?.();
					const startedAtMs = Date.now();
					let nextReminderAtMs = startedAtMs + REST_TARGET_MS;
					set({ restTimer: { state: "expanded", startedAtMs } });
					stopReminders = clock.subscribe(() => {
						const nowMs = clock.getSnapshot();

						if (nowMs < nextReminderAtMs) return;
						get().send({ event: "SET_REST_TIMER_DRAWER_OPEN", open: true });
						void showRestTimerNotification(formatRestElapsedTime(nowMs - startedAtMs));

						while (nextReminderAtMs <= nowMs) {
							nextReminderAtMs += REST_TARGET_REMINDER_INTERVAL_MS;
						}
					});
					break;
				}

				case "SET_REST_TIMER_DRAWER_OPEN":
					set((store) => {
						const { restTimer } = store;

						if (restTimer.state === "idle") return store;

						return {
							restTimer: {
								state: event.open ? "expanded" : "collapsed",
								startedAtMs: restTimer.startedAtMs,
							},
						};
					});
					break;
				case "FINISH_REST_TIMER":
					stopReminders?.();
					stopReminders = undefined;
					set({ restTimer: { state: "idle" } });
					break;
				default: {
					const exhaustiveEvent: never = event;

					return exhaustiveEvent;
				}
			}
		},
	}));
};

export type RestTimerStore = ReturnType<typeof createRestTimerStore>;
