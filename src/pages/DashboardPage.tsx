import NavBar from "../components/NavBar";
import HeaderDashboard from "../components/page-componenets/HeaderDashboard";
import CreateWorkoutButtons from "../components/page-componenets/CreateWorkoutButtons";
import Presets from "../components/page-componenets/Presets";
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
