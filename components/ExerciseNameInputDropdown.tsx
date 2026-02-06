import { Controller, useFormContext, useWatch } from "react-hook-form";
import {
	Combobox,
	ComboboxContent,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "./ui/combobox";
import { Workout } from "@/lib/validateWorkout";
import { useEffect, useState } from "react";

export function ExerciseNameInputDropdown({
	exerciseIndex,
}: {
	exerciseIndex: number;
}) {
	const [suggestions, setSuggestions] = useState<
		{ id: string; name: string }[]
	>([]);

	const { control } = useFormContext<Workout>();

	const searchText =
		useWatch({
			control,
			name: `exercises.${exerciseIndex}.global.name`,
		}) ?? "";

	useEffect(() => {
		if (searchText.trim().length === 0) return;

		const timeout = setTimeout(async () => {
			try {
				const response = await fetch(
					`/api/exercises/search?query=${encodeURIComponent(searchText)}`,
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
	}, [searchText]);

	const handleShowMore = async () => {
		if (searchText.trim().length === 0) return;

		try {
			const response = await fetch(
				`/api/exercises/search?query=${encodeURIComponent(searchText)}&source=api`,
			);
			const dataFromApi = await response.json();
			if (dataFromApi.success) {
				setSuggestions((existing) => [...existing, ...dataFromApi.exercises]);
			}
		} catch (error) {
			console.error("Error fetching from API:", error);
		}
	};

	const filteredSuggestions = searchText.trim()
		? suggestions.map((exercise) => exercise.name)
		: [];

	// const exerciseNames = [
	// 	"Bench Press",
	// 	"Lat Pulldown",
	// 	"Seated Cable Row",
	// 	"Cable Flyes",
	// 	"Cable Crunches",
	// 	"Leg Press",
	// 	"Romanian Deadlifts",
	// 	"Leg Extensions",
	// 	"Hamstring Curls",
	// 	"Calf Raises",
	// 	"Bicep Curls",
	// 	"Tricep Extensions",
	// ];

	return (
		<Controller
			name={`exercises.${exerciseIndex}.global.name`}
			control={control}
			render={({ field }) => (
				<Combobox
					items={filteredSuggestions}
					onValueChange={field.onChange}>
					<ComboboxInput
						placeholder="Enter an exercise..."
						className="text-2xl font-medium h-11"
						value={field.value}
						onChange={(input) => field.onChange(input.target.value)}
					/>
					<ComboboxContent>
						<ComboboxList>
							{filteredSuggestions.map((exercise) => (
								<ComboboxItem
									className="text-base"
									key={exercise}
									value={exercise}>
									{exercise}
								</ComboboxItem>
							))}
							{searchText.trim().length > 0 && (
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
