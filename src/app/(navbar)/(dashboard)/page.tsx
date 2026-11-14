import { Suspense } from "react";
import Dashboard from "@/features/dashboard/components/Dashboard";
import DashboardYearInTraining from "@/features/dashboard/components/DashboardYearInTraining";
import { DashboardYearInTrainingPlaceholder } from "@/features/dashboard/components/DashboardYearInTrainingSection";

export default function DashboardPage() {
	return (
		<Dashboard>
			<Suspense fallback={<DashboardYearInTrainingPlaceholder kind="loading" />}>
				<DashboardYearInTraining />
			</Suspense>
		</Dashboard>
	);
}
