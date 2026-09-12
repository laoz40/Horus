import EditWorkoutLoader from "@/features/workout-form/components/EditWorkoutLoader";

interface EditWorkoutPageProps {
	params: Promise<{ id: string }>;
}

export default async function EditWorkoutPage({ params }: EditWorkoutPageProps) {
	const { id } = await params;

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<EditWorkoutLoader workoutId={id} />
		</div>
	);
}
