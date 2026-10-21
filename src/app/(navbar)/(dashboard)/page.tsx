"use client";

import { type ReactElement } from "react";
import DashboardHeader from "@/features/dashboard/components/DashboardHeader";
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

	const shouldShowSavedProfile =
		sessionData === null && (isPending || (error !== null && error.status !== 401));

	return (
		<div className="flex flex-col gap-3 pt-2 pb-5 max-md:pb-20">
			<DashboardHeader
				shouldShowSavedProfile={shouldShowSavedProfile}
				isPending={isPending}
				user={user}
			/>

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
