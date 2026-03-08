"use client";

import { useState, useEffect } from "react";
import { useConvex } from "convex/react";
import {
	showExerciseSearchFailedToast,
	showExerciseSearchRateLimitToast,
} from "@/lib/toastMessages";
import { deduplicateExercises } from "@/features/workout-form/lib/convertWorkoutData";
import { fetchDefaultExercises } from "@/features/workout-form/lib/fetchExercises";
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

		// ignore late async results after query changes/unmount.
		let isCurrent = true;
		let timeout: ReturnType<typeof setTimeout> | undefined;

		const loadSuggestions = async () => {
			const defaultExercises = fetchDefaultExercises(query);
			if (!isCurrent) return;

			setSuggestions(defaultExercises);
			setIsLoading(true);

			timeout = setTimeout(async () => {
				try {
					const dataFromDb = await convex.query(api.exercises.searchGlobalExercises, {
						query,
					});
					const dbExercises = Array.isArray(dataFromDb) ? dataFromDb : [];
					setSuggestions(deduplicateExercises(defaultExercises, dbExercises));
				} catch (error) {
					console.log("Query not found", error);
					setSuggestions(defaultExercises);
				} finally {
					setIsLoading(false);
				}
			}, 300);
		};
		loadSuggestions();

		return () => {
			isCurrent = false;
			clearTimeout(timeout);
		};
	}, [convex, query]);

	const fetchMoreSuggestions = async () => {
		if (query.trim().length === 0) return;

		setIsLoading(true);

		try {
			const response = await fetch(
				`/api/exercises/search?query=${encodeURIComponent(query)}`,
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
