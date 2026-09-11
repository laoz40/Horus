import ViewWorkoutLoader from "@/features/workout-view/components/ViewWorkoutLoader";

interface ViewWorkoutPageProps {
	params: Promise<{ id: string }>;
}

export default async function ViewWorkoutPage({ params }: ViewWorkoutPageProps) {
	const { id } = await params;

	return <ViewWorkoutLoader workoutId={id} />;
}
