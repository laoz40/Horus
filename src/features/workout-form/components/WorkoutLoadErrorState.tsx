import { isDefinedError } from "@orpc/client";

import WorkoutLoadError from "@/features/workout-form/components/WorkoutLoadError";

interface WorkoutLoadErrorStateProps<TError> {
	error: TError;
	onRetry: () => void;
}

export default function WorkoutLoadErrorState<TError>({
	error,
	onRetry,
}: WorkoutLoadErrorStateProps<TError>) {
	if (!isDefinedError(error)) {
		return (
			<WorkoutLoadError
				message="Something unexpected happened."
				action={{ type: "retry", onRetry }}
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
					action={{ type: "retry", onRetry }}
				/>
			);
		default:
			return (
				<WorkoutLoadError
					message="Something unexpected happened."
					action={{ type: "retry", onRetry }}
				/>
			);
	}
}
