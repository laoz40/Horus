import { ModeToggle } from "@/components/ModeToggle";
import SectionCard from "@/components/SectionCard";
import DeleteAllWorkoutsAction from "@/features/settings/components/DeleteAllWorkoutsAction";
import SettingsAccountButton from "@/features/settings/components/SettingsAccountButton";

export default function SettingsPage() {
	return (
		<>
			<div className="p-4">
				<h1>Settings</h1>
			</div>

			<div className="flex flex-col gap-3">
				<SectionCard
					header="Account"
					className="p-0">
					<SettingsAccountButton />
				</SectionCard>

				<SectionCard header="Appearance">
					<div className="flex flex-row items-center justify-between">
						<span>Theme</span>
						<ModeToggle />
					</div>
				</SectionCard>

				<SectionCard header="Data">
					<div className="flex flex-row items-center justify-between">
						<span>Workouts</span>
						<DeleteAllWorkoutsAction />
					</div>
				</SectionCard>
			</div>
		</>
	);
}
