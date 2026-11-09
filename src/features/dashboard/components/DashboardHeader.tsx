import DashboardAccountButton from "@/features/auth/components/DashboardAccountButton";
import DashboardSavedProfile from "@/features/auth/components/DashboardSavedProfile";

import type { DashboardSession } from "@/features/dashboard/hooks/useDashboardSession";

export default function DashboardHeader({ session }: { session: DashboardSession }) {
	if (session.kind === "loading" || session.kind === "unavailable") {
		return (
			<div className="px-4 pt-2">
				<DashboardSavedProfile isPending={session.kind === "loading"} />
			</div>
		);
	}

	const user = session.kind === "authenticated" ? session.user : null;
	const displayName = user !== null ? (user.name ?? "Legend") : "Legend";
	const headingText = user !== null ? "Welcome back," : "Welcome,";

	return (
		<div className="flex flex-row items-start justify-between px-4 pt-2">
			<div className="flex flex-col">
				<h2 className="text-sm font-normal text-muted-foreground">{headingText}</h2>
				<h1 className="text-2xl leading-tight font-semibold tracking-tight">{displayName}</h1>
			</div>
			<DashboardAccountButton initialUser={user} />
		</div>
	);
}
