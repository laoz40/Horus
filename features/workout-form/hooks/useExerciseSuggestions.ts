"use client";

import { useState, useEffect } from "react";
import {
	showExerciseSearchFailedToast,
	showExerciseSearchRateLimitToast,
} from "@/lib/toastMessages";
import { deduplicateExercises } from "@/features/workout-form/lib/convertWorkoutData";

interface Exercise {
	id: string;
	name: string;
	normalizedName: string;
	muscleGroups?: string[];
}

export function useExerciseSuggestions(query: string) {
	const [suggestions, setSuggestions] = useState<Exercise[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (query && query.trim().length === 0) return;

		setIsLoading(true);

		const timeout = setTimeout(async () => {
			try {
				const response = await fetch(
					`/api/exercises/search?query=${encodeURIComponent(query)}`,
				);
				const dataFromDb = await response.json();
				const dbExercises = Array.isArray(dataFromDb.exercises)
					? dataFromDb.exercises
					: [];
				setSuggestions(dbExercises);
			} catch (error) {
				console.log("Query not found", error);
				setSuggestions([]);
			} finally {
				setIsLoading(false);
			}
		}, 300);

		return () => {
			clearTimeout(timeout);
		};
	}, [query]);

	const fetchMoreSuggestions = async () => {
		if (query && query.trim().length === 0) return;

		setIsLoading(true);

		try {
			const response = await fetch(
				`/api/exercises/search?query=${encodeURIComponent(query)}&source=api`,
			);

			if (response.status === 429) {
				showExerciseSearchRateLimitToast();
				return;
			}
			if (!response.ok) {
				showExerciseSearchFailedToast();
				return;
			}

			const dataFromApi = await response.json();
			if (dataFromApi.success && dataFromApi.exercises.length > 0) {
				setSuggestions((prev) =>
					deduplicateExercises(prev, dataFromApi.exercises),
				);
			}
		} catch (error) {
			console.error("Error fetching from API:", error);
		} finally {
			setIsLoading(false);
		}
	};

	return { suggestions, isLoading, fetchMoreSuggestions };
}
