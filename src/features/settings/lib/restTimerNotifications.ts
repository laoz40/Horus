import { err, errAsync, ok, okAsync, type Result, type ResultAsync } from "neverthrow";

import { tryPromise } from "@/lib/tryPromise";
import { trySync } from "@/lib/trySync";
import { showErrorToast } from "@/lib/toastMessages";

const REST_TIMER_NOTIFICATIONS_STORAGE_KEY = "rest-timer-notifications-enabled";

type LocalStorageError = { reason: "UNAVAILABLE" };

export function readRestTimerNotificationsEnabled(): boolean {
	return trySync({
		try: () => localStorage.getItem(REST_TIMER_NOTIFICATIONS_STORAGE_KEY),
		catch: () => ({ reason: "UNAVAILABLE" as const }),
	})
		.map((value) => value === "true")
		.unwrapOr(false);
}

export function writeRestTimerNotificationsEnabled(
	enabled: boolean,
): Result<null, LocalStorageError> {
	return trySync({
		try: () => {
			localStorage.setItem(REST_TIMER_NOTIFICATIONS_STORAGE_KEY, enabled ? "true" : "false");
		},
		catch: () => ({ reason: "UNAVAILABLE" as const }),
	}).map(() => null);
}

// iOS/Safari only allows permission prompts from a direct user gesture.
function requestRestTimerNotificationPermission(): ResultAsync<NotificationPermission, "failed"> {
	return tryPromise({
		try: () => Notification.requestPermission(),
		catch: () => "failed" as const,
	});
}

type RestTimerNotificationPermissionResult =
	| "granted"
	| "unsupported"
	| "blocked"
	| "dismissed"
	| "failed";

type RestTimerNotificationPermissionError = Exclude<
	RestTimerNotificationPermissionResult,
	"granted"
>;

function mapRequestedPermission(
	permission: NotificationPermission,
): Result<true, RestTimerNotificationPermissionError> {
	if (permission === "granted") return ok(true);

	if (permission === "denied") return err("blocked");

	if (permission === "default") return err("dismissed");

	return err("failed");
}

function ensureRestTimerNotificationPermission(): ResultAsync<
	true,
	RestTimerNotificationPermissionError
> {
	if (!("Notification" in window)) return errAsync("unsupported");

	if (Notification.permission === "granted") return okAsync(true);

	if (Notification.permission === "denied") return errAsync("blocked");

	return requestRestTimerNotificationPermission().andThen(mapRequestedPermission);
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

export async function tryEnableRestTimerNotifications(): Promise<boolean> {
	const result = await ensureRestTimerNotificationPermission();

	return result.match(
		() => true,
		(error) => {
			showRestTimerNotificationPermissionError(error);

			return false;
		},
	);
}

function getServiceWorkerRegistration() {
	return tryPromise({
		try: () => navigator.serviceWorker.getRegistration(),
		catch: () => ({ reason: "REGISTRATION_FAILED" as const }),
	});
}

function showServiceWorkerNotification(
	registration: ServiceWorkerRegistration,
	options: NotificationOptions,
) {
	return tryPromise({
		try: () => registration.showNotification("Rest timer", options),
		catch: () => ({ reason: "SHOW_FAILED" as const }),
	});
}

function showBrowserNotification(options: NotificationOptions) {
	return trySync({
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
		const registrationResult = await getServiceWorkerRegistration();

		if (registrationResult.isOk() && registrationResult.value) {
			const shown = await showServiceWorkerNotification(
				registrationResult.value,
				notificationOptions,
			);

			if (shown.isOk()) return;
		}
	}

	// If there is no service worker yet, try the regular browser notification path.
	void showBrowserNotification(notificationOptions);
}
