import SignUpDialog from "@/features/auth/components/SignUpDialog";
import WorkoutForm from "@/features/workout-form/components/WorkoutForm";
import { api } from "@/convex/_generated/api";
import { fetchAuthQuery } from "@/lib/auth-server";

export default async function CreateWorkoutPage() {
	const user = await fetchAuthQuery(api.auth.getCurrentUser);

	return (
		<>
			<SignUpDialog show={!user} />
			<WorkoutForm />
		</>
	);
}
