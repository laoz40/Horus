import WorkoutFormAuthGate from "@/features/auth/components/WorkoutFormAuthGate";
import WorkoutForm from "@/features/workout-form/components/WorkoutForm";

export default function CreateWorkoutPage() {
	return (
		<>
			<WorkoutFormAuthGate />
			<WorkoutForm />
		</>
	);
}
