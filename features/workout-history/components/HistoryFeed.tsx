"use client";

import { type Preloaded, usePaginatedQuery, usePreloadedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import HistoryList from "./HistoryList";
import HistoryPagination from "./HistoryPagination";

interface HistoryFeedProps {
	preloaded: Preloaded<typeof api.workouts.listWorkouts>;
	WORKOUTS_PER_PAGE: number;
}

export default function HistoryFeed({ preloaded, WORKOUTS_PER_PAGE }: HistoryFeedProps) {
	const preloadedWorkouts = usePreloadedQuery(preloaded);
	const { results, status, loadMore } = usePaginatedQuery(
		api.workouts.listWorkouts,
		{},
		{ initialNumItems: WORKOUTS_PER_PAGE },
	);

	const isLoadingFirstPage = status === "LoadingFirstPage";
	// if loading first page, use preloaded workouts
	// if loading with pagination, use fetched results
	const workouts = isLoadingFirstPage ? preloadedWorkouts.page : results;
	// if loading first page, determine end based on preloaded results
	// if loading with pagination, check using client hook
	const hasNextPage = isLoadingFirstPage
		? !preloadedWorkouts.isDone
		: status === "CanLoadMore";
	const isLoading = status === "LoadingMore" || isLoadingFirstPage;

	return (
		<>
			<HistoryList
				workouts={workouts}
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
