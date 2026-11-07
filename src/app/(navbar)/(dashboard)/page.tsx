"use client";

import { type ReactElement } from "react";
import DashboardHeader from "@/features/dashboard/components/DashboardHeader";
import DashboardDesktopNotice from "@/features/dashboard/components/DashboardDesktopNotice";
import DashboardPresetsSection from "@/features/dashboard/components/DashboardPresetsSection";
import { Button } from "@/components/ui/button";
import { IconClock } from "@tabler/icons-react";
import Link from "next/link";
import DashboardYearInTrainingSection from "@/features/dashboard/components/DashboardYearInTrainingSection";
import ErrorBoundary from "@/components/ErrorBoundary";
import { authClient } from "@/lib/auth-client";
import SignUpDialog from "@/features/auth/components/SignUpDialog";

export default function DashboardPage(): ReactElement {
	const { data: sessionData, isPending, error } = authClient.useSession();
	const user = sessionData?.user ?? null;

	const isSignedIn = user !== null;

	const shouldShowSavedProfile =
		sessionData === null && (isPending || (error !== null && error.status !== 401));

	return (
		<div className="flex flex-col gap-3 pt-2 pb-5">
			{!isPending && !isSignedIn && <SignUpDialog />}
			<DashboardHeader
				shouldShowSavedProfile={shouldShowSavedProfile}
				isPending={isPending}
				user={user}
			/>

			<div className="px-4">
				<DashboardDesktopNotice />
			</div>
			<DashboardYearInTrainingSection
				isAuthPending={isPending}
				isSignedIn={isSignedIn}
				userId={user?.id}
				yearSelectable
			/>
			<div className="px-4">
				<Button
					asChild
					variant="outline"
					size="lg"
					className="w-full">
					<Link href="/workouts">
						<IconClock data-icon="inline-start" />
						Workout history
					</Link>
				</Button>
			</div>
			<ErrorBoundary>
				<DashboardPresetsSection />
			</ErrorBoundary>
		</div>
	);
}
