import HeaderDashboard from "../components/dashboard-components/HeaderDashboard";
import CreateWorkoutButtons from "../components/dashboard-components/CreateWorkoutButtons";
import Presets from "../components/dashboard-components/Presets";

const DashboardPage = () => {
	return (
		<>
			<HeaderDashboard />
			<CreateWorkoutButtons />
			<Presets />
		</>
	);
};

export default DashboardPage;
