"use client";

import DashboardAccountButton from "@/features/auth/components/DashboardAccountButton";
import DashboardPresetsSection from "@/features/dashboard/components/DashboardPresetsSection";
import DashboardStartSection from "@/features/dashboard/components/DashboardStartSection";

export default function DashboardPage() {
	return (
		<div className="flex flex-col gap-3 pt-2 pb-5">
			<div className="flex flex-row items-start justify-between px-4 pt-2">
				<div className="flex flex-col">
					<h2 className="text-sm font-normal text-muted-foreground">Welcome back,</h2>
					<h1 className="text-2xl leading-tight font-semibold tracking-tight">Leo Zhou</h1>
				</div>
				<DashboardAccountButton />
			</div>

			<DashboardStartSection />
			<DashboardPresetsSection />
		</div>
	);
}
