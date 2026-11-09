"use client";

import { useReducer } from "react";

import SectionCard from "@/components/SectionCard";
import { Switch } from "@/components/ui/switch";
import {
	readRestTimerNotificationsEnabled,
	tryEnableRestTimerNotifications,
	writeRestTimerNotificationsEnabled,
} from "@/features/settings/lib/restTimerNotifications";
import { showErrorToast } from "@/lib/toastMessages";

type NotificationPreferenceState =
	| { kind: "disabled" }
	| { kind: "requestingPermission" }
	| { kind: "enabled" };

type NotificationPreferenceEvent =
	| { kind: "requestPermission" }
	| { kind: "enableSucceeded" }
	| { kind: "enableFailed" }
	| { kind: "disableSucceeded" };

function notificationPreferenceReducer(
	state: NotificationPreferenceState,
	event: NotificationPreferenceEvent,
): NotificationPreferenceState {
	switch (event.kind) {
		case "requestPermission":
			if (state.kind !== "disabled") return state;

			return { kind: "requestingPermission" };
		case "enableSucceeded":
			if (state.kind !== "requestingPermission") return state;

			return { kind: "enabled" };
		case "enableFailed":
			if (state.kind !== "requestingPermission") return state;

			return { kind: "disabled" };
		case "disableSucceeded":
			if (state.kind !== "enabled") return state;

			return { kind: "disabled" };
		default: {
			const exhaustiveEvent: never = event;

			return exhaustiveEvent;
		}
	}
}

export default function NotificationsSettingsSection() {
	const [state, dispatch] = useReducer(
		notificationPreferenceReducer,
		undefined,
		(): NotificationPreferenceState => ({
			kind: readRestTimerNotificationsEnabled() ? "enabled" : "disabled",
		}),
	);

	async function handleRestTimerNotificationsChange(checked: boolean): Promise<void> {
		if (state.kind === "requestingPermission") return;

		if (checked) {
			dispatch({ kind: "requestPermission" });
			const enabled = await tryEnableRestTimerNotifications();

			if (!enabled) {
				dispatch({ kind: "enableFailed" });

				return;
			}
		}

		if (!writeRestTimerNotificationsEnabled(checked)) {
			showErrorToast("Couldn't save notification preference.");
			dispatch({ kind: "enableFailed" });

			return;
		}

		dispatch({ kind: checked ? "enableSucceeded" : "disableSucceeded" });
	}

	return (
		<SectionCard header="Notifications">
			<div className="flex min-h-8 flex-row items-center justify-between">
				<label
					className="cursor-pointer"
					htmlFor="rest-timer-notifications">
					Allow notifications
				</label>
				<Switch
					id="rest-timer-notifications"
					checked={state.kind === "enabled"}
					disabled={state.kind === "requestingPermission"}
					onCheckedChange={(checked) => void handleRestTimerNotificationsChange(checked)}
				/>
			</div>
		</SectionCard>
	);
}
