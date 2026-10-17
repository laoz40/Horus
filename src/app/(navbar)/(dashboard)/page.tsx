"use client";

import { type ReactElement } from "react";
import DashboardAccountButton from "@/features/auth/components/DashboardAccountButton";
import DashboardSavedProfile from "@/features/auth/components/DashboardSavedProfile";
import DashboardDesktopNotice from "@/features/dashboard/components/DashboardDesktopNotice";
import DashboardPresetsSection from "@/features/dashboard/components/DashboardPresetsSection";
import DashboardStartSection from "@/features/dashboard/components/DashboardStartSection";
import DashboardYearInTrainingSection from "@/features/dashboard/components/DashboardYearInTrainingSection";
import ErrorBoundary from "@/components/ErrorBoundary";
import { authClient } from "@/lib/auth-client";

export default function DashboardPage(): ReactElement {
	const { data: sessionData, isPending, error } = authClient.useSession();
	const user = sessionData?.user ?? null;

	const isSignedIn = user !== null;
	const displayName = isSignedIn ? (user.name ?? "Legend") : "Legend";
	const headingText = isSignedIn ? "Welcome back," : "Welcome,";

	const shouldShowSavedProfile =
		sessionData === null && (isPending || (error !== null && error.status !== 401));

	return (
		<div className="flex flex-col gap-3 pt-2 pb-5 max-md:pb-20">
			{shouldShowSavedProfile ? (
				<div className="px-4 pt-2">
					<DashboardSavedProfile isPending={isPending} />
				</div>
			) : (
				<div className="flex flex-row items-start justify-between px-4 pt-2">
					<div className="flex flex-col">
						<h2 className="text-sm font-normal text-muted-foreground">{headingText}</h2>
						<h1 className="text-2xl leading-tight font-semibold tracking-tight">{displayName}</h1>
					</div>
					<DashboardAccountButton initialUser={user} />
				</div>
			)}

			<div className="px-4">
				<DashboardDesktopNotice />
			</div>
			<ErrorBoundary>
				<DashboardStartSection />
			</ErrorBoundary>
			<ErrorBoundary>
				<DashboardPresetsSection />
			</ErrorBoundary>
			<DashboardYearInTrainingSection
				isAuthPending={isPending}
				isSignedIn={isSignedIn}
				userId={user?.id}
			/>
		</div>
	);
}
