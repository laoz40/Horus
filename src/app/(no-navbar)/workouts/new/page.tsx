import WorkoutFormAuthGate from "@/features/auth/components/WorkoutFormAuthGate";
import WorkoutForm from "@/features/workout-form/components/WorkoutForm";

export default function CreateWorkoutPage() {
	return (
		<div className="create-workout-page page-slide-up flex min-h-0 flex-1 flex-col">
			<WorkoutFormAuthGate />
			<WorkoutForm />
		</div>
	);
}
