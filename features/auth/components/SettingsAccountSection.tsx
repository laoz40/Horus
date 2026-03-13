"use client";

import SectionCard from "@/components/SectionCard";
import { authClient } from "@/lib/auth-client";

import SettingsAccountBar from "./SettingsAccountBar";

export default function SettingsAccountSection() {
	const { data: sessionData, isPending } = authClient.useSession();
	const user = sessionData?.user ?? null;

	if (isPending) {
		return (
			<>
				<SectionCard
					header=""
					className="p-0">
					<div className="flex items-center justify-between px-2 py-2">
						<div className="flex items-center gap-2">
							<div className="size-10 animate-pulse rounded-full bg-muted" />
							<div className="flex flex-col gap-2">
								<div className="h-4 w-28 animate-pulse rounded bg-muted" />
								<div className="h-3 w-40 animate-pulse rounded bg-muted" />
							</div>
						</div>
						<div className="flex items-center gap-2">
							<div className="h-4 w-14 animate-pulse rounded bg-muted" />
							<div className="size-6 animate-pulse rounded bg-muted" />
						</div>
					</div>
				</SectionCard>
			</>
		);
	}

	return (
		<>
			<SectionCard
				header=""
				className="p-0">
				<SettingsAccountBar initialUser={user} />
			</SectionCard>
		</>
	);
}
