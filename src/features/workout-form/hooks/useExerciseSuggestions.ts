"use client";

import { useDeferredValue, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { showErrorToast } from "@/lib/toastMessages";
import { deduplicateExercises } from "@/features/workout-form/lib/convertWorkoutData";
import { fetchDefaultExercises } from "@/features/workout-form/lib/fetchExercises";
import { sortExercisesAlphabetically } from "@/features/workout-form/lib/sortExercises";
import type { ExerciseSuggestion } from "@/features/workout-form/lib/types";
import { orpc } from "@/lib/orpc/client";
import { err, ok } from "neverthrow";
import * as z from "zod";

// The /api/exercises/search response is untrusted network data; parse it at the boundary.
const ExerciseSearchResponseSchema = z.discriminatedUnion("success", [
	z.object({
		success: z.literal(true),
		exercises: z.array(
			z.object({
				id: z.string(),
				name: z.string(),
				normalizedName: z.string(),
				muscleGroups: z.array(z.string()).optional(),
			}),
		),
	}),
	z.object({
		success: z.literal(false),
		error: z.string().optional(),
	}),
]);

const fetchOnlineExerciseSuggestions = async (query: string) => {
	const response = await fetch(`/api/exercises/search?query=${encodeURIComponent(query)}`);

	const parsedResponse = ExerciseSearchResponseSchema.safeParse(await response.json());

	if (!parsedResponse.success) {
		return err({
			code: "INVALID_RESPONSE",
		} as const);
	}

	// The route answers failures with a JSON body rather than throwing.
	if (!parsedResponse.data.success) {
		return err({
			code: response.status === 429 ? "RATE_LIMITED" : "REQUEST_FAILED",
		} as const);
	}

	return ok(parsedResponse.data);
};

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

export function useExerciseSuggestions(rawQuery: string) {
	const [isOnlineSearchLoading, setIsOnlineSearchLoading] = useState(false);

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

	const fetchMoreSuggestions = async () => {
		if (query.length === 0) return;

		setIsOnlineSearchLoading(true);

		try {
			const result = await queryClient.fetchQuery({
				queryKey: ["exercise-search-online", query],
				queryFn: () => fetchOnlineExerciseSuggestions(query),
				staleTime: 1000 * 60 * 1,
				gcTime: 1000 * 60 * 3,
			});

			result.match(
				(data) => {
					if (data.exercises.length > 0) {
						setOnlineExercisesByQuery((prev) => ({
							...prev,
							[query]: deduplicateExercises(prev[query] ?? [], data.exercises),
						}));
					}
				},
				(error) => {
					const code = error.code;

					switch (code) {
						case "RATE_LIMITED":
							showErrorToast("Too many requests. Please try again later.");

							return;
						case "REQUEST_FAILED":
							showErrorToast("Failed to fetch exercises.");

							return;
						case "INVALID_RESPONSE":
							showErrorToast("The exercise search response was not in the expected format.");

							return;
						default:
							throw new Error(`Unhandled app error code: ${String(code satisfies never)}`);
					}
				},
			);
		} finally {
			setIsOnlineSearchLoading(false);
		}
	};

	const isLoading = isDbSearchLoading || isOnlineSearchLoading;

	return {
		suggestions,
		isDbSearchLoading,
		isLoading,
		isOnlineSearchLoading,
		fetchMoreSuggestions,
	};
}
