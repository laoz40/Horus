import { Routes, Route } from "react-router";
import DashboardPage from "./pages/DashboardPage";
import CreateWorkoutPage from "./pages/CreateWorkoutPage";
import HistoryPage from "./pages/HistoryPage";
import ProgressPage from "./pages/ProgressPage";
import SettingsPage from "./pages/SettingsPage";
import "./App.css";

function App() {
	return (
		<>
			<Routes>
				<Route
					path="/"
					element={<DashboardPage />}
				/>
				<Route
					path="/workout"
					element={<CreateWorkoutPage />}
				/>
				<Route
					path="/history"
					element={<HistoryPage />}
				/>
				<Route
					path="/progress"
					element={<ProgressPage />}
				/>
				<Route
					path="/settings"
					element={<SettingsPage />}
				/>
			</Routes>
		</>
	);
}

export default App;
