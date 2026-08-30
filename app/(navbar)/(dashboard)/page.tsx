"use client";

import { type ReactElement } from "react";
import DashboardAccountButton from "@/features/auth/components/DashboardAccountButton";
import DashboardPresetsSection from "@/features/dashboard/components/DashboardPresetsSection";
import DashboardStartSection from "@/features/dashboard/components/DashboardStartSection";
import DashboardYearInTrainingSection from "@/features/dashboard/components/DashboardYearInTrainingSection";
import ErrorBoundary from "@/components/ErrorBoundary";
import { authClient } from "@/lib/auth-client";

export default function DashboardPage(): ReactElement {
	const { data: sessionData, isPending } = authClient.useSession();
	const user = sessionData?.user ?? null;

	const isSignedIn = user !== null;
	const displayName = isSignedIn ? (user.name ?? "Legend") : "Legend";
	const headingText = isSignedIn ? "Welcome back," : "Welcome,";
	const shouldShowSkeleton = isPending && sessionData === null;

	return (
		<div className="flex flex-col gap-3 pt-2 pb-5">
			<div className="flex flex-row items-start justify-between px-4 pt-2">
				<div className="flex flex-col">
					{shouldShowSkeleton ? (
						<>
							<div className="mb-1 h-4 w-22 animate-pulse rounded bg-muted" />
							<div className="h-8 w-32 animate-pulse rounded bg-muted" />
						</>
					) : (
						<>
							<h2 className="text-sm font-normal text-muted-foreground">{headingText}</h2>
							<h1 className="text-2xl leading-tight font-semibold tracking-tight">{displayName}</h1>
						</>
					)}
				</div>
				{shouldShowSkeleton ? (
					<div className="size-10 animate-pulse rounded-full bg-muted" />
				) : (
					<DashboardAccountButton initialUser={user} />
				)}
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
