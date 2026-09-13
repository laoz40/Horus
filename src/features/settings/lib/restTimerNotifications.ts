import { showErrorToast } from "@/lib/toastMessages";

const REST_TIMER_NOTIFICATIONS_STORAGE_KEY = "rest-timer-notifications-enabled";

export function readRestTimerNotificationsEnabled(): boolean {
	try {
		return localStorage.getItem(REST_TIMER_NOTIFICATIONS_STORAGE_KEY) === "true";
	} catch {
		return false;
	}
}

export function writeRestTimerNotificationsEnabled(enabled: boolean): void {
	try {
		localStorage.setItem(REST_TIMER_NOTIFICATIONS_STORAGE_KEY, enabled ? "true" : "false");
	} catch {
		// localStorage is unavailable outside the browser.
	}
}

// iOS/Safari only allows permission prompts from a direct user gesture.
export async function requestRestTimerNotificationPermission(): Promise<NotificationPermission | null> {
	if (!("Notification" in window)) return null;

	try {
		return await Notification.requestPermission();
	} catch {
		return null;
	}
}

export type RestTimerNotificationPermissionResult =
	| "granted"
	| "unsupported"
	| "blocked"
	| "dismissed"
	| "failed";

export async function ensureRestTimerNotificationPermission(): Promise<RestTimerNotificationPermissionResult> {
	if (!("Notification" in window)) return "unsupported";

	if (Notification.permission === "granted") return "granted";

	if (Notification.permission === "denied") return "blocked";

	const permission = await requestRestTimerNotificationPermission();

	if (permission === "granted") return "granted";

	if (permission === "denied") return "blocked";

	if (permission === "default") return "dismissed";

	return "failed";
}

function showRestTimerNotificationPermissionError(
	permission: Exclude<RestTimerNotificationPermissionResult, "granted">,
): void {
	if (permission === "unsupported") {
		showErrorToast("Notifications aren't supported in this browser.");

		return;
	}

	if (permission === "blocked") {
		showErrorToast("Notifications are blocked in your browser. Allow them in site settings first.");

		return;
	}

	if (permission === "dismissed") {
		showErrorToast("Notification permission wasn't granted.");

		return;
	}

	showErrorToast("Couldn't request notification permission.");
}

export async function tryEnableRestTimerNotifications(): Promise<boolean> {
	const permission = await ensureRestTimerNotificationPermission();

	if (permission === "granted") return true;

	showRestTimerNotificationPermissionError(permission);

	return false;
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
		try {
			const registration = await navigator.serviceWorker.getRegistration();

			if (registration) {
				await registration.showNotification("Rest timer", notificationOptions);

				return;
			}
		} catch {
			// Fall back to the Notification constructor when service worker notifications are unavailable.
		}
	}

	// If there is no service worker yet, try the regular browser notification path.
	try {
		void new Notification("Rest timer", notificationOptions);
	} catch {
		// Some browsers, including Android Chrome, disallow the Notification constructor.
	}
}
