"use client";

import { useState, useEffect } from "react";
import { useConvex } from "convex/react";
import { useQueryClient } from "@tanstack/react-query";
import { showErrorToast } from "@/lib/toastMessages";
import { deduplicateExercises } from "@/features/workout-form/lib/convertWorkoutData";
import { fetchDefaultExercises } from "@/features/workout-form/lib/fetchExercises";
import { sortExercisesAlphabetically } from "@/features/workout-form/lib/sortExercises";
import { api } from "@/convex/_generated/api";
import type { ExerciseSuggestion } from "@/features/workout-form/lib/types";
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
	const [isDbSearchLoading, setIsDbSearchLoading] = useState(false);
	const [isOnlineSearchLoading, setIsOnlineSearchLoading] = useState(false);
	const convex = useConvex();
	const queryClient = useQueryClient();

	const query = rawQuery.trim();

	useEffect(() => {
		if (query.length === 0) {
			setSuggestions([]);
			setIsDbSearchLoading(false);
			return;
		}

		// to ignore late async results after query changes/unmount
		let isCurrent = true;

		// use default exercises for instant results
		const defaultExercises = sortExercisesAlphabetically(fetchDefaultExercises(query));
		setSuggestions(defaultExercises);
		setIsDbSearchLoading(true);

		// debounce the query by 300ms
		const timeout = setTimeout(async () => {
			try {
				const dataFromDb = await convex.query(api.exercises.searchGlobalExercises, {
					query,
				});
				if (!isCurrent) return;

				const dbExercises = Array.isArray(dataFromDb) ? dataFromDb : [];
				setSuggestions(
					sortExercisesAlphabetically(deduplicateExercises(defaultExercises, dbExercises)),
				);
			} catch (error) {
				if (!isCurrent) return;
				console.log("Query not found", error);
				setSuggestions(defaultExercises);
			} finally {
				if (isCurrent) {
					setIsDbSearchLoading(false);
				}
			}
		}, 300);

		// cleanup: cancel the timeout
		return () => {
			isCurrent = false;
			setIsDbSearchLoading(false);
			clearTimeout(timeout);
		};
	}, [convex, query]);

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
