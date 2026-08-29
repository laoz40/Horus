"use client";

import { useEffect } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { Button } from "@/components/ui/button";
import { showErrorToast } from "@/lib/toastMessages";
import HistoryFeed from "./HistoryFeed";

interface HistoryFeedErrorBoundaryProps {
	WORKOUTS_PER_PAGE: number;
}

const getHistoryFeedErrorMessage = (error: Error) => {
	// orpc errors carry a `code` field on top of the standard Error shape.
	if ("code" in error && error.code === "UNAUTHORIZED") {
		return "You must be signed in to view workout history.";
	}

	return "Unexpected error loading workout history.";
};

function HistoryFeedErrorFallback({ error, resetErrorBoundary }: Readonly<FallbackProps>) {
	// React hands the boundary an arbitrary thrown value; only real Errors can carry an orpc code
	const message =
		error instanceof Error
			? getHistoryFeedErrorMessage(error)
			: "Unexpected error loading workout history.";

	useEffect(() => {
		showErrorToast(message);
	}, [message]);

	return (
		<div className="space-y-3 rounded-md border border-border/80 bg-card/50 px-5 py-6 text-center">
			<p className="text-sm text-muted-foreground">{message}</p>
			<Button
				type="button"
				onClick={resetErrorBoundary}
				variant="outline">
				Try again
			</Button>
		</div>
	);
}

export default function HistoryFeedErrorBoundary({
	WORKOUTS_PER_PAGE,
}: Readonly<HistoryFeedErrorBoundaryProps>) {
	return (
		<ErrorBoundary FallbackComponent={HistoryFeedErrorFallback}>
			<HistoryFeed WORKOUTS_PER_PAGE={WORKOUTS_PER_PAGE} />
		</ErrorBoundary>
	);
}
