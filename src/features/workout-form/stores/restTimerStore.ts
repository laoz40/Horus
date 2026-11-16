import { create } from "zustand";

type RestTimerState =
	| { state: "idle" }
	| { state: "expanded"; startedAtMs: number }
	| { state: "collapsed"; startedAtMs: number };

type RestTimerEvent =
	| { event: "START_REST_TIMER" }
	| { event: "SET_REST_TIMER_DRAWER_OPEN"; open: boolean }
	| { event: "FINISH_REST_TIMER" };

type RestTimerStore = {
	restTimer: RestTimerState;
	send: (event: RestTimerEvent) => void;
};

export const useRestTimerStore = create<RestTimerStore>()((set) => ({
	restTimer: { state: "idle" },
	send: (event) =>
		set((store) => {
			switch (event.event) {
				case "START_REST_TIMER":
					return { restTimer: { state: "expanded", startedAtMs: Date.now() } };
				case "SET_REST_TIMER_DRAWER_OPEN": {
					const { restTimer } = store;

					if (restTimer.state === "idle") return store;

					return {
						restTimer: {
							state: event.open ? "expanded" : "collapsed",
							startedAtMs: restTimer.startedAtMs,
						},
					};
				}

				case "FINISH_REST_TIMER":
					return { restTimer: { state: "idle" } };
				default: {
					const exhaustiveEvent: never = event;

					return exhaustiveEvent;
				}
			}
		}),
}));
