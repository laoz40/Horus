import { ModeToggle } from "@/components/ModeToggle";
import SettingsAccountSection from "@/features/auth/components/SettingsAccountSection";
import ExercisesSettingsSection from "@/features/settings/components/ExercisesSettingsSection";
import NotificationsSettingsSection from "@/features/settings/components/NotificationsSettingsSection";
import SettingsDataSection from "@/features/settings/components/SettingsDataSection";

export default function SettingsPage() {
	return (
		<>
			<div className="p-4">
				<h1 className="text-2xl font-semibold">Settings</h1>
			</div>

			<div className="flex flex-col gap-3">
				<SettingsAccountSection />

				<section className="mb-3 flex flex-col pr-4 pl-4">
					<h2 className="mb-1 text-sm text-muted-foreground">Appearance</h2>
					<div className="rounded-md border bg-card p-2">
						<div className="flex flex-row items-center justify-between">
							<span>Theme</span>
							<ModeToggle />
						</div>
					</div>
				</section>

				<NotificationsSettingsSection />

				<ExercisesSettingsSection />

				<SettingsDataSection />
			</div>
		</>
	);
}
