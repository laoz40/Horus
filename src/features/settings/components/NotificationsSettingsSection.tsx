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

export default function NotificationsSettingsSection() {
	const [restTimerNotificationsEnabled, setRestTimerNotificationsEnabled] = useState(
		readRestTimerNotificationsEnabled,
	);

	async function handleRestTimerNotificationsChange(checked: boolean): Promise<void> {
		if (!checked) {
			const writeResult = writeRestTimerNotificationsEnabled(false);

			if (writeResult.isErr()) {
				showErrorToast("Couldn't save notification preference.");

				return;
			}

			setRestTimerNotificationsEnabled(false);

			return;
		}

		const enabled = await tryEnableRestTimerNotifications();

		if (!enabled) return;

		const writeResult = writeRestTimerNotificationsEnabled(true);

		if (writeResult.isErr()) {
			showErrorToast("Couldn't save notification preference.");

			return;
		}

		setRestTimerNotificationsEnabled(true);
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
					checked={restTimerNotificationsEnabled}
					onCheckedChange={(checked) => void handleRestTimerNotificationsChange(checked)}
				/>
			</div>
		</SectionCard>
	);
}
