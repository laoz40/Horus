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

		switch (event.kind) {
			case "enable": {
				if (state.kind === "enabled") return;

				isRequestingPermission.current = true;
				setState({ kind: "requestingPermission" });

				const permissionGranted = await tryEnableRestTimerNotifications();

				isRequestingPermission.current = false;

				if (!permissionGranted || !writeRestTimerNotificationsEnabled(true)) {
					setState({ kind: "disabled" });

					return;
				}

				setState({ kind: "enabled" });

				return;
			}

			case "disable":
				if (state.kind === "disabled" || !writeRestTimerNotificationsEnabled(false)) return;

				setState({ kind: "disabled" });

				return;
			default: {
				const exhaustiveEvent: never = event;

				return exhaustiveEvent;
			}
		}
	}

	return { state, send };
}
