import TextInput from "../components/TextInput";
import HeaderActions from "../components/workout-components/HeaderActions";

const CreateWorkoutPage = () => {
	return (
		<>
			<HeaderActions />
			<TextInput label="Workout Name" />
		</>
	);
};

export default CreateWorkoutPage;
