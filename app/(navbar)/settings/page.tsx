import { ModeToggle } from "@/components/ModeToggle";
import SectionCard from "@/components/SectionCard";
import SettingsAccountButton from "@/features/auth/components/SettingsAccountButton";
import DeleteAllWorkoutsSection from "@/features/settings/components/DeleteAllWorkoutsSection";

export default function SettingsPage() {
	return (
		<>
			<div className="p-4">
				<h1>Settings</h1>
			</div>

			<div className="flex flex-col gap-3">
				<SectionCard
					header="Account"
					className="p-0 min-h-19">
					<SettingsAccountButton />
				</SectionCard>

				<SectionCard header="Appearance">
					<div className="flex flex-row items-center justify-between">
						<span>Theme</span>
						<ModeToggle />
					</div>
				</SectionCard>

				<DeleteAllWorkoutsSection />
			</div>
		</>
	);
}
