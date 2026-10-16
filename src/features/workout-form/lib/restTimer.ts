export type RestTimerState =
	| { kind: "idle" }
	| { kind: "expanded"; startedAtMs: number }
	| { kind: "collapsed"; startedAtMs: number };

type RestTimerEvent =
	| { kind: "start"; startedAtMs: number }
	| { kind: "openDrawer" }
	| { kind: "closeDrawer" }
	| { kind: "finish" };

export function restTimerReducer(state: RestTimerState, event: RestTimerEvent): RestTimerState {
	switch (event.kind) {
		case "start":
			return { kind: "expanded", startedAtMs: event.startedAtMs };
		case "openDrawer":
			if (state.kind !== "collapsed") return state;

			return { kind: "expanded", startedAtMs: state.startedAtMs };
		case "closeDrawer":
			if (state.kind !== "expanded") return state;

			return { kind: "collapsed", startedAtMs: state.startedAtMs };
		case "finish":
			return { kind: "idle" };
		default: {
			const exhaustiveEvent: never = event;

			return exhaustiveEvent;
		}
	}
}
