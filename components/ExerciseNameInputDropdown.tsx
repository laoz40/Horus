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

export function ExerciseNameInputDropdown({
	exerciseIndex,
}: {
	exerciseIndex: number;
}) {
	const [suggestions, setSuggestions] = useState<
		{ id: string; name: string }[]
	>([]);
	const [searchText, setSearchText] = useState("");

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

	const filteredSuggestions = searchText.trim()
		? suggestions.map((exercise) => exercise.name)
		: [];

	console.log("Suggestions passed to Combobox:", filteredSuggestions);

	const handleShowMore = async () => {
		if (searchText.trim().length === 0) return;

		try {
			const response = await fetch(
				`/api/exercises/search?query=${encodeURIComponent(searchText)}&source=api`,
			);
			const dataFromApi = await response.json();
			console.log("dataFromApi", dataFromApi);

			if (dataFromApi.success) {
				setSuggestions((existing) => [...existing, ...dataFromApi.exercises]);
			}
		} catch (error) {
			console.error("Error fetching from API:", error);
		}
	};

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

	const { control } = useFormContext<Workout>();

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
						value={searchText}
						onChange={(e) => {
							setSearchText(e.target.value);
							field.onChange(e.target.value);
						}}
					/>
					<ComboboxContent>
						<ComboboxList>
							{filteredSuggestions.map((item) => (
								<ComboboxItem
									className="text-base"
									key={item}
									value={item}>
									{item}
								</ComboboxItem>
							))}
							{searchText.trim().length > 0 && (
								<button
									className="text-base text-muted-foreground underline w-full flex justify-start align-center p-2"
									onClick={handleShowMore}>
									Show more
								</button>
							)}
						</ComboboxList>
					</ComboboxContent>
				</Combobox>
			)}
		/>
	);
}
