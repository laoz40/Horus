"use client";

import { useRef, useState } from "react";

import {
	readRestTimerNotificationsEnabled,
	tryEnableRestTimerNotifications,
	writeRestTimerNotificationsEnabled,
} from "@/features/settings/lib/restTimerNotifications";

type NotificationPreferenceState =
	| { kind: "disabled" }
	| { kind: "requestingPermission" }
	| { kind: "enabled" };

type NotificationPreferenceEvent = { kind: "enable" } | { kind: "disable" };

export function useNotificationPreference() {
	const [state, setState] = useState<NotificationPreferenceState>(() => ({
		kind: readRestTimerNotificationsEnabled() ? "enabled" : "disabled",
	}));

	const isRequestingPermission = useRef(false);

	async function send(event: NotificationPreferenceEvent): Promise<void> {
		if (isRequestingPermission.current || state.kind === "requestingPermission") return;

		const enabled = event.kind === "enable";

		if (enabled === (state.kind === "enabled")) return;

		if (enabled) {
			isRequestingPermission.current = true;
			setState({ kind: "requestingPermission" });

			const permissionGranted = await tryEnableRestTimerNotifications();

			isRequestingPermission.current = false;

			if (!permissionGranted) {
				setState({ kind: "disabled" });

				return;
			}
		}

		if (!writeRestTimerNotificationsEnabled(enabled)) {
			if (enabled) setState({ kind: "disabled" });

			return;
		}

		setState({ kind: enabled ? "enabled" : "disabled" });
	}

	return { state, send };
}
