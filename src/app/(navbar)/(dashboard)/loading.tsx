import Dashboard from "@/features/dashboard/components/Dashboard";
import { DashboardYearInTrainingPlaceholder } from "@/features/dashboard/components/DashboardYearInTrainingSection";

export default function DashboardLoading() {
	return (
		<Dashboard>
			<DashboardYearInTrainingPlaceholder kind="loading" />
		</Dashboard>
	);
}
