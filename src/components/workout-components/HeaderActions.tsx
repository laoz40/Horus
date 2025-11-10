import Button from "../Button";
import "./HeaderActions.css";

const HeaderActions = () => {
	return (
		<div className="header-actions-container">
			<Button
				to="/"
				variant="secondary"
				shape="small"
				id="back-button">
				Back
			</Button>
			<Button
				variant="primary"
				shape="small"
				id="finish-button">
				Finish
			</Button>
		</div>
	);
};

export default HeaderActions;
