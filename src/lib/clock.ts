const listeners = new Set<() => void>();

let nowMs = 0;

let interval: ReturnType<typeof setInterval> | undefined;

// All clock consumers share one interval, which stops with the last subscription.
export const clock = {
	subscribe: (listener: () => void) => {
		listeners.add(listener);

		if (interval === undefined) {
			nowMs = Date.now();
			interval = setInterval(() => {
				nowMs = Date.now();
				listeners.forEach((notify) => notify());
			}, 1000);
		}

		return () => {
			listeners.delete(listener);

			if (listeners.size === 0) {
				clearInterval(interval);
				interval = undefined;
			}
		};
	},
	getSnapshot: () => nowMs,
	getServerSnapshot: () => 0,
};
