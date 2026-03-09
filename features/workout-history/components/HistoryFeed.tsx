"use client";

import { useConvexAuth, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import HistoryList from "./HistoryList";
import HistoryPagination from "./HistoryPagination";
import { WorkoutCardSkeletonList } from "./HistoryWorkoutCardSkeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface HistoryFeedProps {
	WORKOUTS_PER_PAGE: number;
}

export default function HistoryFeed({ WORKOUTS_PER_PAGE }: HistoryFeedProps) {
	const { isAuthenticated, isLoading } = useConvexAuth();

	if (isLoading) {
		return <WorkoutCardSkeletonList count={WORKOUTS_PER_PAGE} />;
	}

	if (!isAuthenticated) {
		return <SignInPrompt />;
	}

	return (
		<Content WORKOUTS_PER_PAGE={WORKOUTS_PER_PAGE} />
	);
}

function Content({ WORKOUTS_PER_PAGE }: HistoryFeedProps) {
	const { results, status, loadMore } = usePaginatedQuery(
		api.workouts.listWorkouts,
		{},
		{ initialNumItems: WORKOUTS_PER_PAGE },
	);

	const isLoadingFirstPage = status === "LoadingFirstPage";
	const hasNextPage = status === "CanLoadMore";
	const isLoading = status === "LoadingMore" || isLoadingFirstPage;

	return (
		<>
			<HistoryList
				workouts={results}
				isLoading={isLoadingFirstPage}
				WORKOUTS_PER_PAGE={WORKOUTS_PER_PAGE}
			/>
			<HistoryPagination
				hasNextPage={hasNextPage}
				isLoading={isLoading}
				onLoadMore={() => loadMore(WORKOUTS_PER_PAGE)}
				className="mt-1"
			/>
		</>
	);
}

function SignInPrompt() {
	return (
		<div className="flex flex-col items-center justify-center gap-3 rounded-md border border-border/80 bg-card/50 px-5 py-6 text-center">
			<p className="text-sm text-muted-foreground">You need an account to save workouts.</p>
			<Button asChild>
				<Link href="/login">Sign in</Link>
			</Button>
		</div>
	);
}
