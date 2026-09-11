"use client";

import { isDefinedError } from "@orpc/client";
import { useQuery } from "@tanstack/react-query";

import { workoutByIdQueryOptions } from "@/features/workout-form/lib/workoutByIdQuery";

import WorkoutForm from "@/features/workout-form/components/WorkoutForm";
import WorkoutFormPageSkeleton from "@/features/workout-form/components/WorkoutFormPageSkeleton";
import WorkoutLoadError from "@/features/workout-form/components/WorkoutLoadError";

interface EditWorkoutLoaderProps {
	workoutId: string;
}

export default function EditWorkoutLoader({ workoutId }: EditWorkoutLoaderProps) {
	const workoutQuery = useQuery(workoutByIdQueryOptions(workoutId));

	if (workoutQuery.isPending) {
		return <WorkoutFormPageSkeleton />;
	}

	if (workoutQuery.isError) {
		const error = workoutQuery.error;

		if (!isDefinedError(error)) {
			return (
				<WorkoutLoadError
					message="Something unexpected happened."
					action={{ type: "retry", onRetry: workoutQuery.refetch }}
				/>
			);
		}

		switch (error.code) {
			case "NOT_FOUND":
				return (
					<WorkoutLoadError
						message="This workout could not be found."
						action={{ type: "none" }}
					/>
				);
			case "UNAUTHORIZED":
				return (
					<WorkoutLoadError
						message="You must sign in to view this workout."
						action={{ type: "link", href: "/login", label: "Sign in" }}
					/>
				);
			case "DATABASE_ERROR":
				return (
					<WorkoutLoadError
						message="The workout could not be loaded."
						action={{ type: "retry", onRetry: workoutQuery.refetch }}
					/>
				);
			default: {
				const exhaustiveError: never = error;

				return exhaustiveError;
			}
		}
	}

	return (
		<WorkoutForm
			initialData={workoutQuery.data}
			workoutId={workoutId}
		/>
	);
}
