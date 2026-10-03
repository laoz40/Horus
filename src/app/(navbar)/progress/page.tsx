"use client";

import { type ReactElement } from "react";

import DashboardYearInTrainingSection from "@/features/dashboard/components/DashboardYearInTrainingSection";
import ProgressExerciseBrowseSection from "@/features/progress/components/ProgressExerciseBrowseSection";
import { authClient } from "@/lib/auth-client";

export default function ProgressPage(): ReactElement {
	const { data: sessionData, isPending } = authClient.useSession();
	const isSignedIn = sessionData?.user !== undefined && sessionData.user !== null;

	return (
		<div className="flex h-full w-full flex-1 flex-col pt-4">
			<DashboardYearInTrainingSection
				isAuthPending={isPending}
				isSignedIn={isSignedIn}
				userId={sessionData?.user?.id}
				yearSelectable
			/>
			<ProgressExerciseBrowseSection />
		</div>
	);
}
