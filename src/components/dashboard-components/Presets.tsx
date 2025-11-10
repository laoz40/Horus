import Button from "../Button";
import Section from "../Section";
import "./Presets.css";

const Presets = () => {
	return (
		<Section
			header="Presets"
			id="presets-section">
			<div className="presets-container">
				<Button
					variant="secondary"
					shape="square"
					icon="fitness_center"
					id="test-button">
					Upper Body 1
				</Button>
				<Button
					variant="secondary"
					icon="sports_gymnastics"
					shape="square"
					id="test-button">
					Lower Body 1
				</Button>
				<Button
					variant="secondary"
					icon="fitness_center"
					shape="square"
					id="test-button">
          Upper Body 2
				</Button>
				<Button
					variant="secondary"
					icon="sports_gymnastics"
					shape="square"
					id="test-button">
          Lower Body 2
				</Button>
			</div>
		</Section>
	);
};

export default Presets;
