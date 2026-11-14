"use client";

import type { ReactNode } from "react";
import DashboardHeader from "@/features/dashboard/components/DashboardHeader";
import DashboardDesktopNotice from "@/features/dashboard/components/DashboardDesktopNotice";
import DashboardPresetsSection from "@/features/dashboard/components/DashboardPresetsSection";
import { Button } from "@/components/ui/button";
import { IconClock } from "@tabler/icons-react";
import Link from "next/link";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useDashboardSession } from "@/features/dashboard/hooks/useDashboardSession";
import SignUpDialog from "@/features/auth/components/SignUpDialog";

export default function Dashboard({ children }: { children: ReactNode }) {
	const session = useDashboardSession();

	return (
		<div className="flex flex-col gap-3 pt-2 pb-5">
			{session.kind === "unauthenticated" && <SignUpDialog />}
			<DashboardHeader session={session} />

			<div className="px-4">
				<DashboardDesktopNotice />
			</div>
			{children}
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
