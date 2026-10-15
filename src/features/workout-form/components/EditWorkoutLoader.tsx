"use client";

import { isDefinedError } from "@orpc/client";
import { Match } from "effect";
import { useQuery } from "@tanstack/react-query";

import { workoutByIdQueryOptions } from "@/features/workout-form/lib/workoutByIdQuery";

import PageLoadingSpinner from "@/components/PageLoadingSpinner";

import WorkoutForm from "@/features/workout-form/components/WorkoutForm";
import WorkoutLoadError from "@/features/workout-form/components/WorkoutLoadError";

interface EditWorkoutLoaderProps {
	workoutId: string;
}

export default function EditWorkoutLoader({ workoutId }: EditWorkoutLoaderProps) {
	const workoutQuery = useQuery(workoutByIdQueryOptions(workoutId));

	if (workoutQuery.isPending) {
		return <PageLoadingSpinner label="Loading workout" />;
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

		return Match.value(error).pipe(
			Match.when({ code: "NOT_FOUND" }, () => (
				<WorkoutLoadError
					message="This workout could not be found."
					action={{ type: "none" }}
				/>
			)),
			Match.when({ code: "UNAUTHORIZED" }, () => (
				<WorkoutLoadError
					message="You must sign in to view this workout."
					action={{ type: "link", href: "/login", label: "Sign in" }}
				/>
			)),
			Match.when({ code: "DATABASE_ERROR" }, () => (
				<WorkoutLoadError
					message="The workout could not be loaded."
					action={{ type: "retry", onRetry: workoutQuery.refetch }}
				/>
			)),
			Match.exhaustive,
		);
	}

	return (
		<WorkoutForm
			initialData={workoutQuery.data}
			workoutId={workoutId}
		/>
	);
}
