function NavBar() {
	return (
		<nav>
			<a
				className="nav-button nav-active"
				data-page="workout-dashboard-page">
				<i className="nav-icon material-icons">fitness_center</i>
				<span className="nav-text">Workout</span>
			</a>

			<a
				className="nav-button"
				data-page="history-page">
				<i className="nav-icon material-icons">history</i>
				<span className="nav-text">History</span>
			</a>

			<a
				className="nav-button"
				data-page="progress-page">
				<i className="nav-icon material-icons">trending_up</i>
				<span className="nav-text">Progress</span>
			</a>

			<a
				className="nav-button"
				data-page="settings-page">
				<i className="material-icons nav-icon">settings</i>
				<span className="nav-text">Settings</span>
			</a>
		</nav>
	);
}

export default NavBar;
