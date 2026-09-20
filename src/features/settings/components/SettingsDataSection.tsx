"use client";

import DeleteAllWorkoutsSection from "@/features/settings/components/DeleteAllWorkoutsSection";
import { authClient } from "@/lib/auth-client";

import SignOutButton from "@/features/auth/components/SignOutButton";

export default function SettingsDataSection() {
	const { data: sessionData, isPending } = authClient.useSession();
	const user = sessionData?.user ?? null;

	if (isPending) {
		return (
			<>
				<section className="mb-3 flex flex-col pr-4 pl-4">
					<h2 className="mb-1 text-sm text-muted-foreground">Data</h2>
					<div className="rounded-md border bg-card p-2">
						<div className="flex items-center justify-between">
							<div className="h-5 w-16 animate-pulse rounded-sm bg-muted" />
							<div className="h-9 w-36 animate-pulse rounded-md bg-muted" />
						</div>
					</div>
				</section>

				<div className="px-4">
					<div className="h-10 w-full animate-pulse rounded-md bg-muted" />
				</div>
			</>
		);
	}

	if (!user) {
		return null;
	}

	return (
		<>
			<DeleteAllWorkoutsSection />
			<SignOutButton className="mx-4" />
		</>
	);
}
