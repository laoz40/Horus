import { ModeToggle } from "@/components/ModeToggle";
import SectionCard from "@/components/SectionCard";
import { api } from "@/convex/_generated/api";
import SettingsAccountBar from "@/features/auth/components/SettingsAccountBar";
import SignOutButton from "@/features/auth/components/SignOutButton";
import DeleteAllWorkoutsSection from "@/features/settings/components/DeleteAllWorkoutsSection";
import { fetchAuthQuery } from "@/lib/auth-server";

export default async function SettingsPage() {
	const user = await fetchAuthQuery(api.auth.getCurrentUser);

	return (
		<>
			<div className="p-4">
				<h1 className="text-2xl font-semibold">Settings</h1>
			</div>

			<div className="flex flex-col gap-3">
				<SectionCard
					header=""
					className="p-0">
					<SettingsAccountBar initialUser={user} />
				</SectionCard>

				<SectionCard header="Appearance">
					<div className="flex flex-row items-center justify-between">
						<span>Theme</span>
						<ModeToggle />
					</div>
				</SectionCard>

				{user ? <DeleteAllWorkoutsSection /> : null}

				<SignOutButton className="mx-4"/>
			</div>
		</>
	);
}
