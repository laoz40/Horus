import DashboardAccountButton from "@/features/auth/components/DashboardAccountButton";
import DashboardSavedProfile from "@/features/auth/components/DashboardSavedProfile";

interface DashboardHeaderProps {
	shouldShowSavedProfile: boolean;
	isPending: boolean;
	user: Parameters<typeof DashboardAccountButton>[0]["initialUser"];
}

export default function DashboardHeader({
	shouldShowSavedProfile,
	isPending,
	user,
}: DashboardHeaderProps) {
	const displayName = user !== null ? (user.name ?? "Legend") : "Legend";
	const headingText = user !== null ? "Welcome back," : "Welcome,";

	if (shouldShowSavedProfile) {
		return (
			<div className="px-4 pt-2">
				<DashboardSavedProfile isPending={isPending} />
			</div>
		);
	}

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
