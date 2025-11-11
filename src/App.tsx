import { Routes, Route } from "react-router";
import DashboardPage from "./pages/DashboardPage";
import CreateWorkoutPage from "./pages/CreateWorkoutPage";
import HistoryPage from "./pages/HistoryPage";
import ProgressPage from "./pages/ProgressPage";
import SettingsPage from "./pages/SettingsPage";
import "./App.css";
import LayoutNav from "./pages/layouts/LayoutNav";
import LayoutNoNav from "./pages/layouts/LayoutNoNav";

const App = () => {
	return (
		<>
			<Routes>
				<Route
					path="/"
					element={<LayoutNav />}>
					<Route
						index
						element={<DashboardPage />}
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
				</Route>
				<Route element={<LayoutNoNav />}>
					<Route
						path="/workout"
						element={<CreateWorkoutPage />}
					/>
				</Route>
			</Routes>
		</>
	);
};

export default App;
