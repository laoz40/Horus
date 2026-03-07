"use client";

import { Authenticated, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import HistoryList from "./HistoryList";
import HistoryPagination from "./HistoryPagination";

interface HistoryFeedProps {
	WORKOUTS_PER_PAGE: number;
}

export default function HistoryFeed({ WORKOUTS_PER_PAGE }: HistoryFeedProps) {
	return (
		<Authenticated>
			<Content WORKOUTS_PER_PAGE={WORKOUTS_PER_PAGE} />
		</Authenticated>
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
