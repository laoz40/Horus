import "./HeaderDashboard.css";

const HeaderDashboard = () => {
	const user_name = "Leo Carreras";

	return (
		<section className="dashboard-header">
			<div>
				<h2 className="welcome-message">Welcome back,</h2>
				<h1 className="user-name">{user_name}</h1>
			</div>
			<img
				className="profile-image"
				src="https://images.unsplash.com/photo-1761872936081-344b9b67cedc"
				alt="User Profile"
			/>
		</section>
	);
}

export default HeaderDashboard;
