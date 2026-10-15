"use client";

import { useQuery } from "@tanstack/react-query";

import PageLoadingSpinner from "@/components/PageLoadingSpinner";

import WorkoutLoadErrorState from "@/features/workout-form/components/WorkoutLoadErrorState";
import { workoutByIdQueryOptions } from "@/features/workout-form/lib/workoutByIdQuery";
import WorkoutView from "@/features/workout-view/components/WorkoutView";

interface ViewWorkoutLoaderProps {
	workoutId: string;
}

export default function ViewWorkoutLoaderComponent({ workoutId }: ViewWorkoutLoaderProps) {
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
		<WorkoutView
			workout={workoutQuery.data}
			workoutId={workoutId}
		/>
	);
}
