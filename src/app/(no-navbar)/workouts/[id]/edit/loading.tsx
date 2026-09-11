import WorkoutFormPageSkeleton from "@/features/workout-form/components/WorkoutFormPageSkeleton";

export default function EditWorkoutLoading() {
	return (
		<div className="create-workout-page page-slide-up flex min-h-0 flex-1 flex-col">
			<WorkoutFormPageSkeleton />
		</div>
	);
}
