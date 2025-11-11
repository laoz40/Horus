import { Outlet } from "react-router-dom";
import "./Layout.css";

const LayoutNoNav = () => {
	return (
		<>
			<main className="gap-small">
				<Outlet />
			</main>
		</>
	);
};

export default LayoutNoNav;
