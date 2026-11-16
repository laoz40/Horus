import { create } from "zustand";

type RestTimerState =
	| { state: "idle" }
	| { state: "expanded"; startedAtMs: number }
	| { state: "collapsed"; startedAtMs: number };

type RestTimerStore = {
	restTimer: RestTimerState;
	actions: {
		startRestTimer: () => void;
		setRestTimerDrawerOpen: (open: boolean) => void;
		finishRestTimer: () => void;
	};
};

export const useRestTimerStore = create<RestTimerStore>()((set) => ({
	restTimer: { state: "idle" },
	actions: {
		startRestTimer: () => set({ restTimer: { state: "expanded", startedAtMs: Date.now() } }),
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
		finishRestTimer: () => set({ restTimer: { state: "idle" } }),
	},
}));
