"use client";

import { useState, useEffect } from "react";
import { useConvex } from "convex/react";
import {
	showExerciseSearchFailedToast,
	showExerciseSearchRateLimitToast,
} from "@/lib/toastMessages";
import { deduplicateExercises } from "@/features/workout-form/lib/convertWorkoutData";
import { api } from "@/convex/_generated/api";

interface Exercise {
	id: string;
	name: string;
	normalizedName: string;
	muscleGroups?: string[];
}

export function useExerciseSuggestions(query: string) {
	const [suggestions, setSuggestions] = useState<Exercise[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const convex = useConvex();

	useEffect(() => {
		if (query.trim().length === 0) return;

		setIsLoading(true);

		const timeout = setTimeout(async () => {
			try {
				const dataFromDb = await convex.query(api.exercises.searchGlobalExercises, {
					query,
				});
				const dbExercises = Array.isArray(dataFromDb) ? dataFromDb : [];
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
	}, [convex, query]);

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
				setSuggestions((prev) => deduplicateExercises(prev, dataFromApi.exercises));
			}
		} catch (error) {
			console.error("Error fetching from API:", error);
		} finally {
			setIsLoading(false);
		}
	};

	return { suggestions, isLoading, fetchMoreSuggestions };
}
