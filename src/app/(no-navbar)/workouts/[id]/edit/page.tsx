import EditWorkoutLoader from "@/features/workout-form/components/EditWorkoutLoader";

interface EditWorkoutPageProps {
	params: Promise<{ id: string }>;
}

export default async function EditWorkoutPage({ params }: EditWorkoutPageProps) {
	const { id } = await params;

	return <EditWorkoutLoader workoutId={id} />;
}
