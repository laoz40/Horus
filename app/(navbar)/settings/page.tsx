import { ModeToggle } from "@/components/ModeToggle";
import SectionCard from "@/components/SectionCard";
import SettingsAccountBar from "@/features/auth/components/SettingsAccountBar";
import DeleteAllWorkoutsSection from "@/features/settings/components/DeleteAllWorkoutsSection";

export default function SettingsPage() {
	return (
		<>
			<div className="p-4">
				<h1 className="text-2xl font-semibold">Settings</h1>
			</div>

			<div className="flex flex-col gap-3">
				<SectionCard
					header=""
					className="p-0">
					<SettingsAccountBar />
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
