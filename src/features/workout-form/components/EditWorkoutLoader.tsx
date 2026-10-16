"use client";

import { useQuery } from "@tanstack/react-query";

import { workoutByIdQueryOptions } from "@/features/workout-view/lib/workoutByIdQuery";

import PageLoadingSpinner from "@/components/PageLoadingSpinner";

import WorkoutForm from "@/features/workout-form/components/WorkoutForm";
import WorkoutLoadErrorState from "@/features/workout-form/components/WorkoutLoadErrorState";

interface EditWorkoutLoaderProps {
	workoutId: string;
}

export default function EditWorkoutLoader({ workoutId }: EditWorkoutLoaderProps) {
	const workoutQuery = useQuery(workoutByIdQueryOptions(workoutId));

	if (workoutQuery.isPending) {
		return <PageLoadingSpinner label="Loading workout" />;
	}

	if (workoutQuery.isError) {
		return (
			<WorkoutLoadErrorState
				error={workoutQuery.error}
				onRetry={workoutQuery.refetch}
			/>
		);
	}

	return (
		<WorkoutForm
			initialData={workoutQuery.data}
			workoutId={workoutId}
		/>
	);
}
