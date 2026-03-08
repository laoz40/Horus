"use client";

import { Authenticated, Unauthenticated, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import HistoryList from "./HistoryList";
import HistoryPagination from "./HistoryPagination";
import { SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

interface HistoryFeedProps {
	WORKOUTS_PER_PAGE: number;
}

export default function HistoryFeed({ WORKOUTS_PER_PAGE }: HistoryFeedProps) {
	return (
		<>
			<Authenticated>
				<Content WORKOUTS_PER_PAGE={WORKOUTS_PER_PAGE} />
			</Authenticated>
			<Unauthenticated>
				<div className="flex flex-col items-center justify-center gap-3 rounded-md border border-border/80 bg-card/50 px-5 py-6 text-center">
					<p className="text-sm text-muted-foreground">
						You need an account to save workouts.
					</p>
					<SignUpButton>
						<Button>Sign in</Button>
					</SignUpButton>
				</div>
			</Unauthenticated>
		</>
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
