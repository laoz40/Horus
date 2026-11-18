"use client";

import SectionCard from "@/components/SectionCard";
import { Switch } from "@/components/ui/switch";
import { useNotificationPreference } from "@/features/settings/hooks/useNotificationPreference";

export default function NotificationsSettingsSection() {
	const { state, send } = useNotificationPreference();

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
					onCheckedChange={(enabled) => void send({ kind: enabled ? "enable" : "disable" })}
				/>
			</div>
		</SectionCard>
	);
}
