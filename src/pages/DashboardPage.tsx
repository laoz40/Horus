import NavBar from "../components/NavBar";
import HeaderDashboard from "../components/dashboard-components/HeaderDashboard";
import CreateWorkoutButtons from "../components/dashboard-components/CreateWorkoutButtons";
import Presets from "../components/dashboard-components/Presets";
import "./page.css"

const DashboardPage = () => {
	return (
		<>
			<HeaderDashboard />
			<CreateWorkoutButtons />
			<Presets />
			<NavBar />
		</>
	);
};

export default DashboardPage;
