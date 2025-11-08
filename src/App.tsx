import { Routes, Route } from "react-router";
import Dashboard from "./pages/Dashboard";
import "./App.css";

function App() {
	return <>
		<Routes>
			<Route path="/" element={<Dashboard />} />
		</Routes>
	</>;
}

export default App;
