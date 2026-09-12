import ViewWorkoutLoader from "@/features/workout-view/components/ViewWorkoutLoader";

interface ViewWorkoutPageProps {
	params: Promise<{ id: string }>;
}

export default async function ViewWorkoutPage({ params }: ViewWorkoutPageProps) {
	const { id } = await params;

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<ViewWorkoutLoader workoutId={id} />
		</div>
	);
}
