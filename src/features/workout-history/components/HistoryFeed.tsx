"use client";

import { useInfiniteQuery, useIsMutating } from "@tanstack/react-query";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/lib/orpc/client";

import PageLoadingSpinner from "@/components/PageLoadingSpinner";

import HistoryList from "@/features/workout-history/components/HistoryList";
import HistoryPagination from "@/features/workout-history/components/HistoryPagination";

interface HistoryFeedProps {
	WORKOUTS_PER_PAGE: number;
}

export default function HistoryFeed({ WORKOUTS_PER_PAGE }: HistoryFeedProps) {
	const { data: sessionData, isPending } = authClient.useSession();

	if (isPending) {
		return (
			<PageLoadingSpinner
				label="Loading workouts"
				className="min-h-48"
			/>
		);
	}

	if (!sessionData) {
		return <SignInPrompt />;
	}

	return <Content WORKOUTS_PER_PAGE={WORKOUTS_PER_PAGE} />;
}

function Content({ WORKOUTS_PER_PAGE }: HistoryFeedProps) {
	const isCreatingWorkout = useIsMutating({ mutationKey: orpc.workouts.create.mutationKey() }) > 0;
	const isUpdatingWorkout = useIsMutating({ mutationKey: orpc.workouts.update.mutationKey() }) > 0;

	const historyQuery = useInfiniteQuery(
		orpc.workouts.list.infiniteOptions({
			input: (offset: number) => ({ limit: WORKOUTS_PER_PAGE, offset }),
			initialPageParam: 0,
			getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
			throwOnError: true,
		}),
	);

	const workouts = historyQuery.data?.pages.flatMap((page) => page.items) ?? [];

	if (isCreatingWorkout && !historyQuery.data) {
		return (
			<PageLoadingSpinner
				label="Loading workouts"
				className="min-h-48"
			/>
		);
	}

	return (
		<>
			<HistoryList
				workouts={workouts}
				isLoading={historyQuery.isPending}
				isPrPending={isUpdatingWorkout}
			/>
			<HistoryPagination
				hasNextPage={historyQuery.hasNextPage}
				isLoading={historyQuery.isFetchingNextPage}
				onLoadMore={() => historyQuery.fetchNextPage()}
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
