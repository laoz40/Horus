"use client";

import { type ReactElement } from "react";

import DashboardYearInTrainingSection from "@/features/dashboard/components/DashboardYearInTrainingSection";
import { authClient } from "@/lib/auth-client";

export default function ProgressPage(): ReactElement {
	const { data: sessionData, isPending } = authClient.useSession();
	const isSignedIn = sessionData?.user !== undefined && sessionData.user !== null;

	return (
		<div className="flex h-full w-full flex-col pt-4">
			<DashboardYearInTrainingSection
				isAuthPending={isPending}
				isSignedIn={isSignedIn}
				userId={sessionData?.user?.id}
			/>
		</div>
	);
}
