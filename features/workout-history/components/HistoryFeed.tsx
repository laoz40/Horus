"use client";

import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import HistoryList from "./HistoryList";
import HistoryPagination from "./HistoryPagination";

const WORKOUTS_PER_PAGE = 10;

export default function HistoryFeed() {
	const { results, status, loadMore } = usePaginatedQuery(
		api.workouts.listWorkouts,
		{},
		{ initialNumItems: WORKOUTS_PER_PAGE },
	);

	const hasNextPage = status === "CanLoadMore";
	const isLoadingMore = status === "LoadingMore";

	return (
		<>
			<HistoryList workouts={results} />
			<HistoryPagination
				hasNextPage={hasNextPage}
				isLoadingMore={isLoadingMore}
				onLoadMore={() => loadMore(WORKOUTS_PER_PAGE)}
				className="mt-1"
			/>
		</>
	);
}
