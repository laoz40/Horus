"use client";

import { useState } from "react";

import SectionCard from "@/components/SectionCard";
import { Switch } from "@/components/ui/switch";
import {
	readRestTimerNotificationsEnabled,
	tryEnableRestTimerNotifications,
	writeRestTimerNotificationsEnabled,
} from "@/features/settings/lib/restTimerNotifications";
import { showErrorToast } from "@/lib/toastMessages";

type NotificationPreferenceState =
	| { state: "disabled" }
	| { state: "requestingPermission" }
	| { state: "enabled" };

export default function NotificationsSettingsSection() {
	const [preference, setPreference] = useState<NotificationPreferenceState>(() => ({
		state: readRestTimerNotificationsEnabled() ? "enabled" : "disabled",
	}));

	async function handleNotificationsChange(enabled: boolean): Promise<void> {
		switch (preference.state) {
			case "requestingPermission":
				return;
			case "disabled": {
				if (!enabled) return;

				setPreference({ state: "requestingPermission" });

				const permissionGranted = await tryEnableRestTimerNotifications();

				if (!permissionGranted) {
					setPreference({ state: "disabled" });

					return;
				}

				break;
			}

			case "enabled":
				if (enabled) return;

				break;
			default: {
				const exhaustiveState: never = preference;

				return exhaustiveState;
			}
		}

		if (!writeRestTimerNotificationsEnabled(enabled)) {
			showErrorToast("Couldn't save notification preference.");

			if (enabled) setPreference({ state: "disabled" });

			return;
		}

		setPreference({ state: enabled ? "enabled" : "disabled" });
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
					checked={preference.state === "enabled"}
					disabled={preference.state === "requestingPermission"}
					onCheckedChange={(enabled) => void handleNotificationsChange(enabled)}
				/>
			</div>
		</SectionCard>
	);
}
