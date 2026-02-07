import { Controller, useFormContext } from "react-hook-form";
import {
	Combobox,
	ComboboxContent,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "./ui/combobox";
import { Workout } from "@/lib/validateWorkout";
import { useEffect, useState } from "react";
import { mergeDeduplicateExercises } from "@/lib/convertWorkoutData";

export function ExerciseNameInputDropdown({
	exerciseIndex,
}: {
	exerciseIndex: number;
}) {
	const { control, getValues } = useFormContext<Workout>();

	const getExerciseName = getValues(`exercises.${exerciseIndex}.global.name`);

	const [suggestions, setSuggestions] = useState<
		{ id: string; name: string }[]
	>([]);
	const [query, setQuery] = useState<string>(getExerciseName ?? "");

	useEffect(() => {
		if (query && query.trim().length === 0) return;

		const timeout = setTimeout(async () => {
			try {
				const response = await fetch(
					`/api/exercises/search?query=${encodeURIComponent(query)}`,
				);
				const dataFromDb = await response.json();
				const exercisesFromDb = Array.isArray(dataFromDb.exercises)
					? dataFromDb.exercises
					: [];
				setSuggestions(exercisesFromDb);
			} catch (error) {
				console.log("Query not found", error);
				setSuggestions([]);
			}
		}, 300);
		return () => clearTimeout(timeout);
	}, [query]);

	const handleShowMore = async () => {
		if (query && query.trim().length === 0) return;

		try {
			const response = await fetch(
				`/api/exercises/search?query=${encodeURIComponent(query)}&source=api`,
			);
			const dataFromApi = await response.json();
			if (dataFromApi.success) {
				const mergedExercises = mergeDeduplicateExercises(
					suggestions,
					dataFromApi.exercises,
				);
				setSuggestions(mergedExercises);
			}
		} catch (error) {
			console.error("Error fetching from API:", error);
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
					}}>
					<ComboboxInput
						placeholder="Enter an exercise..."
						className="text-2xl font-medium h-11"
						value={query}
						onChange={(e) => setQuery(e.target.value ?? "")}
						onBlur={() => field.onChange(query)}
					/>
					<ComboboxContent>
						<ComboboxList>
							{filteredSuggestions.map((exercise) => (
								<ComboboxItem
									className="text-base"
									key={exercise.id}
									value={exercise.name}>
									{exercise.name}
								</ComboboxItem>
							))}
							{query.trim() && (
								<button
									className="text-base text-muted-foreground underline w-full flex justify-start align-center p-2"
									onClick={handleShowMore}>
									Search Online
								</button>
							)}
						</ComboboxList>
					</ComboboxContent>
				</Combobox>
			)}
		/>
	);
}
