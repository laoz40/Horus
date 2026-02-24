import { Controller, useFormContext } from "react-hook-form";
import {
	Combobox,
	ComboboxContent,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@/components/ui/combobox";
import { Workout } from "@/features/workout-form/lib/validateWorkout";
import { useEffect, useState } from "react";
import { deduplicateExercises } from "@/features/workout-form/lib/convertWorkoutData";
import {
	showExerciseSearchFailedToast,
	showExerciseSearchRateLimitToast,
} from "@/lib/toastMessages";

export function ExerciseNameInputDropdown({
	exerciseIndex,
}: {
	exerciseIndex: number;
}) {
	const { control, getValues, setValue } = useFormContext<Workout>();
	const getExerciseName = getValues(`exercises.${exerciseIndex}.global.name`);
	const [suggestions, setSuggestions] = useState<
		{
			id: string;
			name: string;
			normalizedName: string;
			muscleGroups?: string[];
		}[]
	>([]);
	const [query, setQuery] = useState<string>(getExerciseName ?? "");
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

	const handleShowMore = async () => {
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
				const mergedExercises = deduplicateExercises(
					suggestions,
					dataFromApi.exercises,
				);
				setSuggestions(mergedExercises);
			}
		} catch (error) {
			console.error("Error fetching from API:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const filteredSuggestions = query.trim() ? suggestions : [];

	return (
		<Controller
			name={`exercises.${exerciseIndex}.global.name`}
			control={control}
			render={({ field }) => (
				<Combobox
					items={filteredSuggestions}
					onValueChange={(value: string | null) => {
						if (!value) return;
						setQuery(value);
						field.onChange(value);

						const match = suggestions.find(
							(exercise) => exercise.name === value,
						);
						setValue(
							`exercises.${exerciseIndex}.global.muscleGroups`,
							match?.muscleGroups ?? [],
						);
					}}>
					<ComboboxInput
						placeholder="Enter an exercise..."
						className="text-2xl font-medium h-11"
						value={query}
						onChange={(e) => {
							setQuery(e.target.value ?? "");
							// reset muscle groups when typing in the input
							setValue(`exercises.${exerciseIndex}.global.muscleGroups`, []);
						}}
						onBlur={() => field.onChange(query)}
					/>
					<ComboboxContent>
						<ComboboxList>
							{filteredSuggestions.map((exercise) => (
								<ComboboxItem
									className="text-base"
									key={exercise.normalizedName}
									value={exercise.name}>
									{exercise.name}
								</ComboboxItem>
							))}
							{query.trim() && (
								<button
									className="text-base text-muted-foreground underline w-full flex justify-start align-center p-2"
									onClick={handleShowMore}>
									{isLoading ? "Loading..." : "Search Online"}
								</button>
							)}
						</ComboboxList>
					</ComboboxContent>
				</Combobox>
			)}
		/>
	);
}
