import { NavLink } from "react-router-dom";
import "./NavBar.css";

function NavBar() {
	return (
		<nav>
			<NavLink
				to="/"
				className="nav-button">
				<i className="nav-icon material-icons">fitness_center</i>
				<span className="nav-text">Workout</span>
			</NavLink>

			<NavLink
				to="/history"
				className="nav-button">
				<i className="nav-icon material-icons">history</i>
				<span className="nav-text">History</span>
			</NavLink>

			<NavLink
				to="/progress"
				className="nav-button">
				<i className="nav-icon material-icons">trending_up</i>
				<span className="nav-text">Progress</span>
			</NavLink>

			<NavLink
				to="/settings"
				className="nav-button">
				<i className="material-icons nav-icon">settings</i>
				<span className="nav-text">Settings</span>
			</NavLink>
		</nav>
	);
}

export default NavBar;
