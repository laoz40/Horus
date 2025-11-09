import Button from "../Button";
import Section from "../Section";
import "./CreateWorkoutButtons.css";

const CreateWorkoutButtons = () => {
	return (
		<Section
			header="Start"
			id="create-workout-section">
			<div className="create-workout-actions">
				<Button
					variant="primary"
					id="new-workout-button">
					New Workout
				</Button>
				<Button
					variant="secondary"
					id="new-preset-button">
					New Preset
				</Button>
			</div>
		</Section>
	);
};

export default CreateWorkoutButtons;
