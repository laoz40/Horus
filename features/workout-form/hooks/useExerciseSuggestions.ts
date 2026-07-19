"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { showErrorToast } from "@/lib/toastMessages";
import { deduplicateExercises } from "@/features/workout-form/lib/convertWorkoutData";
import { fetchDefaultExercises } from "@/features/workout-form/lib/fetchExercises";
import { sortExercisesAlphabetically } from "@/features/workout-form/lib/sortExercises";
import type { ExerciseSuggestion } from "@/features/workout-form/lib/types";
import { orpc } from "@/lib/orpc/client";
import { err, ok } from "neverthrow";

interface ExerciseSearchErrorResponse {
	success: false;
	exercises: [];
	error: string;
}

interface ExerciseSearchSuccessResponse {
	success: true;
	exercises: ExerciseSuggestion[];
}

const fetchOnlineExerciseSuggestions = async (query: string) => {
	const response = await fetch(`/api/exercises/search?query=${encodeURIComponent(query)}`);

	const data = (await response.json()) as
		| ExerciseSearchErrorResponse
		| ExerciseSearchSuccessResponse;

	if (!data.success) {
		return err({
			code: response.status === 429 ? "RATE_LIMITED" : "REQUEST_FAILED",
		} as const);
	}

	if (data.success && !Array.isArray(data.exercises)) {
		return err({
			code: "INVALID_RESPONSE",
		} as const);
	}

	return ok(data);
};

export function useExerciseSuggestions(rawQuery: string) {
	const [suggestions, setSuggestions] = useState<ExerciseSuggestion[]>([]);
	const [debouncedQuery, setDebouncedQuery] = useState("");
	const [isOnlineSearchLoading, setIsOnlineSearchLoading] = useState(false);
	const queryClient = useQueryClient();

	const query = rawQuery.trim();
	const defaultExercises = useMemo(
		() => sortExercisesAlphabetically(fetchDefaultExercises(query)),
		[query],
	);

	// Debounce PostgreSQL searches while keeping local defaults immediate.
	useEffect(() => {
		if (query.length === 0) {
			setDebouncedQuery("");
			return;
		}

		const timeout = setTimeout(() => setDebouncedQuery(query), 300);
		return () => clearTimeout(timeout);
	}, [query]);

	const exerciseSearch = useQuery(
		orpc.exercises.search.queryOptions({
			input: { query: debouncedQuery },
			enabled: debouncedQuery.length > 0,
		}),
	);

	useEffect(() => {
		if (query.length === 0) {
			setSuggestions([]);
			return;
		}

		// Only use database results when they belong to the text currently in the input.
		// This prevents results for an older debounced query from appearing after the user types more.
		const dbExercises = debouncedQuery === query ? (exerciseSearch.data ?? []) : [];

		// Combine instant local matches with PostgreSQL matches, remove duplicates, and sort the dropdown.
		setSuggestions(
			sortExercisesAlphabetically(deduplicateExercises(defaultExercises, dbExercises)),
		);
	}, [debouncedQuery, defaultExercises, exerciseSearch.data, query]);

	const isDbSearchLoading =
		query.length > 0 && (debouncedQuery !== query || exerciseSearch.isFetching);

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
						setSuggestions((prev) =>
							sortExercisesAlphabetically(deduplicateExercises(prev, data.exercises)),
						);
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
							throw new Error(`Unhandled app error code: ${code satisfies never}`);
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
