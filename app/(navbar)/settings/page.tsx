import { ModeToggle } from "@/components/ModeToggle";
import SettingsAccountSection from "@/features/auth/components/SettingsAccountSection";
import SettingsDataSection from "@/features/settings/components/SettingsDataSection";

export default function SettingsPage() {
	return (
		<>
			<div className="p-4">
				<h1 className="text-2xl font-semibold">Settings</h1>
			</div>

			<div className="flex flex-col gap-3">
				<SettingsAccountSection />

				<section className="flex flex-col pr-4 pl-4 mb-3">
					<h2 className="text-muted-foreground mb-1 text-sm">Appearance</h2>
					<div className="p-2 border rounded-md bg-card">
						<div className="flex flex-row items-center justify-between">
							<span>Theme</span>
							<ModeToggle />
						</div>
					</div>
				</section>

				<SettingsDataSection />
			</div>
		</>
	);
}
