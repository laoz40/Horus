import NavBar from "../../components/NavBar";
import { Outlet } from "react-router-dom";
import "./Layout.css";

const LayoutNavHeader = () => {
	return (
		<>
			<main className="gap-default">
				<Outlet />
			</main>
			<NavBar />
		</>
	);
};

export default LayoutNavHeader;
