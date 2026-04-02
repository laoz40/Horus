"use client";

import { useState, useEffect } from "react";
import { useConvex } from "convex/react";
import { useQueryClient } from "@tanstack/react-query";
import {
	showExerciseSearchFailedToast,
	showExerciseSearchRateLimitToast,
} from "@/lib/toastMessages";
import { deduplicateExercises } from "@/features/workout-form/lib/convertWorkoutData";
import { fetchDefaultExercises } from "@/features/workout-form/lib/fetchExercises";
import { api } from "@/convex/_generated/api";

interface ExerciseSuggestion {
	id: string;
	name: string;
	normalizedName: string;
	muscleGroups?: string[];
}

interface ExerciseSearchSuccessResponse {
	success: true;
	exercises: ExerciseSuggestion[];
}

type ExerciseSearchErrorCode = "RATE_LIMITED" | "REQUEST_FAILED";

class ExerciseSearchError extends Error {
	code: ExerciseSearchErrorCode;

	constructor(code: ExerciseSearchErrorCode, message: string) {
		super(message);
		this.name = "ExerciseSearchError";
		this.code = code;
	}
}

const fetchOnlineExerciseSuggestions = async (
	query: string,
): Promise<ExerciseSearchSuccessResponse> => {
	const response = await fetch(`/api/exercises/search?query=${encodeURIComponent(query)}`);

	if (response.status === 429) throw new ExerciseSearchError("RATE_LIMITED", "Too many requests");

	if (!response.ok) {
		throw new ExerciseSearchError(
			"REQUEST_FAILED",
			`Exercise search failed with status ${response.status}`,
		);
	}

	const data = (await response.json()) as Partial<ExerciseSearchSuccessResponse>;

	if (!data.success || !Array.isArray(data.exercises)) {
		throw new ExerciseSearchError(
			"REQUEST_FAILED",
			"Exercise search returned an unexpected response",
		);
	}

	return {
		success: true,
		exercises: data.exercises,
	};
};

export function useExerciseSuggestions(rawQuery: string) {
	const [suggestions, setSuggestions] = useState<ExerciseSuggestion[]>([]);
	const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
	const [isOnlineSearchLoading, setIsOnlineSearchLoading] = useState(false);
	const convex = useConvex();
	const queryClient = useQueryClient();

	const query = rawQuery.trim();

	useEffect(() => {
		if (query.length === 0) {
			setSuggestions([]);
			setIsSuggestionsLoading(false);
			return;
		}

		// to ignore late async results after query changes/unmount
		let isCurrent = true;

		// use default exercises for instant results
		const defaultExercises = fetchDefaultExercises(query);
		setSuggestions(defaultExercises);
		setIsSuggestionsLoading(true);

		// debounce the query by 300ms
		const timeout = setTimeout(async () => {
			try {
				const dataFromDb = await convex.query(api.exercises.searchGlobalExercises, {
					query,
				});
				if (!isCurrent) return;

				const dbExercises = Array.isArray(dataFromDb) ? dataFromDb : [];
				setSuggestions(deduplicateExercises(defaultExercises, dbExercises));
			} catch (error) {
				if (!isCurrent) return;
				console.log("Query not found", error);
				setSuggestions(defaultExercises);
			} finally {
				if (isCurrent) {
					setIsSuggestionsLoading(false);
				}
			}
		}, 300);

		// cleanup: cancel the timeout
		return () => {
			isCurrent = false;
			setIsSuggestionsLoading(false);
			clearTimeout(timeout);
		};
	}, [convex, query]);

	const fetchMoreSuggestions = async () => {
		if (query.length === 0) return;

		setIsOnlineSearchLoading(true);

		try {
			// fetch from exercisesdb api
			const dataFromApi = await queryClient.fetchQuery({
				queryKey: ["exercise-search-online", query],
				queryFn: () => fetchOnlineExerciseSuggestions(query),
				staleTime: 1000 * 60 * 1, // 1 hour
				gcTime: 1000 * 60 * 3, // 3 hours
			});

			if (dataFromApi.exercises.length > 0) {
				setSuggestions((prev) => deduplicateExercises(prev, dataFromApi.exercises));
			}
		} catch (error) {
			if (error instanceof ExerciseSearchError && error.code === "RATE_LIMITED") {
				showExerciseSearchRateLimitToast();
			} else {
				showExerciseSearchFailedToast();
			}
		} finally {
			setIsOnlineSearchLoading(false);
		}
	};

	const isLoading = isSuggestionsLoading || isOnlineSearchLoading;

	return {
		suggestions,
		isLoading,
		isOnlineSearchLoading,
		fetchMoreSuggestions,
	};
}
