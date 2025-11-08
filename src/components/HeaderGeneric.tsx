import "./HeaderGeneric.css";

function HeaderGeneric() {
	const name = "Leo";

	return (
		<div className="page-header">
			<h1 className="page-header-text">Welcome Back, {name}</h1>
		</div>
	);
}

export default HeaderGeneric;
