import { Effect } from "effect";

import { showErrorToast } from "@/lib/toastMessages";

const REST_TIMER_NOTIFICATIONS_STORAGE_KEY = "rest-timer-notifications-enabled";

type LocalStorageError = { reason: "UNAVAILABLE" };

export function readRestTimerNotificationsEnabled(): boolean {
	const readPreference = Effect.try({
		try: () => localStorage.getItem(REST_TIMER_NOTIFICATIONS_STORAGE_KEY),
		catch: (): LocalStorageError => ({ reason: "UNAVAILABLE" }),
	});

	return Effect.runSync(
		Effect.match(
			Effect.map(readPreference, (value) => value === "true"),
			{
				onFailure: () => false,
				onSuccess: (enabled) => enabled,
			},
		),
	);
}

export function writeRestTimerNotificationsEnabled(enabled: boolean): boolean {
	const writePreference = Effect.try({
		try: () => {
			localStorage.setItem(REST_TIMER_NOTIFICATIONS_STORAGE_KEY, enabled ? "true" : "false");
		},
		catch: (): LocalStorageError => ({ reason: "UNAVAILABLE" }),
	});

	return Effect.runSync(
		Effect.match(writePreference, {
			onFailure: () => false,
			onSuccess: () => true,
		}),
	);
}

type RestTimerNotificationPermissionError = "unsupported" | "blocked" | "dismissed" | "failed";

// iOS/Safari only allows permission prompts from a direct user gesture.
function requestRestTimerNotificationPermission(): Effect.Effect<NotificationPermission, "failed"> {
	const permissionRequest = Effect.try({
		try: () => Notification.requestPermission(),
		catch: () => "failed" as const,
	}).pipe(
		Effect.match({
			onFailure: () => ({ ok: false as const }),
			onSuccess: (permissionPromise) => ({ ok: true as const, permissionPromise }),
		}),
		Effect.runSync,
	);

	if (!permissionRequest.ok) return Effect.fail("failed");

	return Effect.tryPromise({
		try: () => permissionRequest.permissionPromise,
		catch: () => "failed" as const,
	});
}

function mapRequestedPermission(
	permission: NotificationPermission,
): Effect.Effect<true, RestTimerNotificationPermissionError> {
	if (permission === "granted") return Effect.succeed(true);

	if (permission === "denied") return Effect.fail("blocked");

	if (permission === "default") return Effect.fail("dismissed");

	return Effect.fail("failed");
}

function ensureRestTimerNotificationPermission(): Effect.Effect<
	true,
	RestTimerNotificationPermissionError
> {
	if (!("Notification" in window)) return Effect.fail("unsupported");

	if (Notification.permission === "granted") return Effect.succeed(true);

	if (Notification.permission === "denied") return Effect.fail("blocked");

	return Effect.flatMap(requestRestTimerNotificationPermission(), mapRequestedPermission);
}

function showRestTimerNotificationPermissionError(
	permission: RestTimerNotificationPermissionError,
): void {
	switch (permission) {
		case "unsupported":
			showErrorToast("Notifications aren't supported in this browser.");
			break;
		case "blocked":
			showErrorToast(
				"Notifications are blocked in your browser. Allow them in site settings first.",
			);
			break;
		case "dismissed":
			showErrorToast("Notification permission wasn't granted.");
			break;
		case "failed":
			showErrorToast("Couldn't request notification permission.");
			break;
		default: {
			const exhaustive: never = permission;

			return exhaustive;
		}
	}
}

export function tryEnableRestTimerNotifications(): Promise<boolean> {
	return Effect.runPromise(
		Effect.match(ensureRestTimerNotificationPermission(), {
			onSuccess: () => true,
			onFailure: (error) => {
				showRestTimerNotificationPermissionError(error);

				return false;
			},
		}),
	);
}

function getServiceWorkerRegistration() {
	return Effect.tryPromise({
		try: () => navigator.serviceWorker.getRegistration(),
		catch: () => ({ reason: "REGISTRATION_FAILED" as const }),
	});
}

function showServiceWorkerNotification(
	registration: ServiceWorkerRegistration,
	options: NotificationOptions,
) {
	return Effect.tryPromise({
		try: () => registration.showNotification("Rest timer", options),
		catch: () => ({ reason: "SHOW_FAILED" as const }),
	});
}

function showBrowserNotification(options: NotificationOptions) {
	return Effect.try({
		try: () => {
			void new Notification("Rest timer", options);
		},
		catch: () => ({ reason: "SHOW_FAILED" as const }),
	});
}

export async function showRestTimerNotification(elapsedTime: string): Promise<void> {
	if (!readRestTimerNotificationsEnabled()) return;

	if (!("Notification" in window)) return;

	if (Notification.permission !== "granted") return;

	const notificationOptions: NotificationOptions = {
		body: `${elapsedTime} rest elapsed. Time for your next set.`,
		tag: "rest-timer-reminder",
	};

	// Prefer the service worker notification path when it is available.
	// This works better for mobile browsers and installed web apps.
	if ("serviceWorker" in navigator) {
		const showWithServiceWorker = Effect.gen(function* () {
			const registration = yield* getServiceWorkerRegistration();

			if (!registration) return false;

			yield* showServiceWorkerNotification(registration, notificationOptions);

			return true;
		});

		const didShow = await Effect.runPromise(
			Effect.match(showWithServiceWorker, {
				onFailure: () => false,
				onSuccess: (shown) => shown,
			}),
		);

		if (didShow) return;
	}

	// If there is no service worker yet, try the regular browser notification path.
	Effect.runSync(
		Effect.match(showBrowserNotification(notificationOptions), {
			onFailure: () => undefined,
			onSuccess: () => undefined,
		}),
	);
}
