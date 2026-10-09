"use client";

import { ORPCError } from "@orpc/client";
import { useDeferredValue, useEffect, useState } from "react";
import { CancelledError, useQuery, useQueryClient } from "@tanstack/react-query";
import { Data, Effect } from "effect";
import { showErrorToast } from "@/lib/toastMessages";
import { deduplicateExercises } from "@/features/workout-form/lib/convertWorkoutData";
import { fetchDefaultExercises } from "@/features/workout-form/lib/fetchExercises";
import { sortExercisesAlphabetically } from "@/features/workout-form/lib/sortExercises";
import type { ExerciseSuggestion } from "@/features/workout-form/lib/types";
import { orpc } from "@/lib/orpc/client";

class RateLimitedSearchError extends Data.TaggedError("RATE_LIMITED") {}

class FailedOnlineSearchError extends Data.TaggedError("REQUEST_FAILED") {}

class UnexpectedOnlineSearchError extends Data.TaggedError("UNEXPECTED") {}

class CancelledOnlineSearchError extends Data.TaggedError("CANCELLED") {}

function classifyOnlineSearchError(cause: unknown) {
	if (cause instanceof CancelledError) return new CancelledOnlineSearchError();

	if (!(cause instanceof ORPCError) || !cause.defined) {
		return new UnexpectedOnlineSearchError();
	}

	if (cause.code === "RATE_LIMITED") return new RateLimitedSearchError();

	if (cause.code === "REQUEST_FAILED") return new FailedOnlineSearchError();

	return new UnexpectedOnlineSearchError();
}

function buildExerciseSuggestions(
	query: string,
	deferredQuery: string,
	dbSearchResults: ExerciseSuggestion[] | undefined,
	defaultExercises: ExerciseSuggestion[],
	onlineExercisesByQuery: Record<string, ExerciseSuggestion[]>,
): ExerciseSuggestion[] {
	// Only use database results when they belong to the text currently in the input.
	// This prevents results for an older deferred query from appearing after the user types more.
	const isDbResultCurrent = query.length > 0 && deferredQuery === query;
	const dbExercises = isDbResultCurrent ? (dbSearchResults ?? []) : [];
	const onlineExercises = onlineExercisesByQuery[query] ?? [];

	return sortExercisesAlphabetically(
		deduplicateExercises(deduplicateExercises(defaultExercises, dbExercises), onlineExercises),
	);
}

export function useExerciseSuggestions(rawQuery: string, isOpen: boolean) {
	// Online "fetch more" results are keyed by query so stale results never leak into the dropdown.
	const [onlineExercisesByQuery, setOnlineExercisesByQuery] = useState<
		Record<string, ExerciseSuggestion[]>
	>({});

	const queryClient = useQueryClient();

	const query = rawQuery.trim();
	const deferredQuery = useDeferredValue(query);
	// An empty query disables the DB search immediately.
	const dbSearchQuery = query.length === 0 ? "" : deferredQuery;

	const defaultExercises = sortExercisesAlphabetically(fetchDefaultExercises(query));

	const exerciseSearch = useQuery(
		orpc.exercises.search.queryOptions({
			input: { query: dbSearchQuery },
			enabled: dbSearchQuery.length > 0,
		}),
	);

	const onlineSearchOptions = orpc.exercises.searchOnline.queryOptions({
		input: { query },
		staleTime: 1000 * 60 * 1,
		gcTime: 1000 * 60 * 3,
	});

	const onlineSearch = useQuery({ ...onlineSearchOptions, enabled: false });
	const isOnlineSearchLoading = isOpen && onlineSearch.isFetching;

	// Cancel the previous online search when its text changes, the picker closes, or it unmounts.
	useEffect(() => {
		if (!isOpen || query.length === 0) return;

		return () => {
			void queryClient.cancelQueries({
				queryKey: orpc.exercises.searchOnline.queryKey({ input: { query } }),
				exact: true,
			});
		};
	}, [isOpen, query, queryClient]);

	// Combine instant local matches with PostgreSQL matches, remove duplicates, and sort the dropdown.
	const suggestions = buildExerciseSuggestions(
		query,
		dbSearchQuery,
		exerciseSearch.data,
		defaultExercises,
		onlineExercisesByQuery,
	);

	const isDbSearchLoading =
		query.length > 0 && (deferredQuery !== query || exerciseSearch.isFetching);

	const fetchMoreSuggestions = () => {
		if (!isOpen || query.length === 0) return Promise.resolve();

		return Effect.runPromise(
			Effect.gen(function* () {
				const exercises = yield* Effect.tryPromise({
					try: () => queryClient.fetchQuery(onlineSearchOptions),
					catch: classifyOnlineSearchError,
				});

				if (exercises.length > 0) {
					yield* Effect.sync(() =>
						setOnlineExercisesByQuery((prev) => ({
							...prev,
							[query]: deduplicateExercises(prev[query] ?? [], exercises),
						})),
					);
				}
			}).pipe(
				Effect.catchTags({
					CANCELLED: () => Effect.succeed(undefined),
					RATE_LIMITED: () =>
						Effect.sync(() => showErrorToast("Too many requests. Please try again later.")),
					REQUEST_FAILED: () => Effect.sync(() => showErrorToast("Failed to fetch exercises.")),
					UNEXPECTED: () => Effect.sync(() => showErrorToast("Failed to fetch exercises.")),
				}),
			),
		);
	};

	return {
		suggestions,
		isDbSearchLoading,
		isLoading: isDbSearchLoading || isOnlineSearchLoading,
		isOnlineSearchLoading,
		fetchMoreSuggestions,
	};
}
