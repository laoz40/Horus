import { Controller, useFormContext } from "react-hook-form";
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
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
		if (!searchText.trim()) return;

		const timeout = setTimeout(async () => {
			try {
				const response = await fetch(
					`/api/exercises/search?query=${encodeURIComponent(searchText)}`,
				);
				const exercisesFromApi = await response.json();
				const exerciseArray = Array.isArray(exercisesFromApi.exercises)
					? exercisesFromApi.exercises
					: [];

				setSuggestions(exerciseArray);
			} catch (err) {
				console.error(err);
				setSuggestions([]);
			}
		}, 500);

		return () => clearTimeout(timeout);
	}, [searchText]);

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
						<ComboboxEmpty>No items found.</ComboboxEmpty>
						<ComboboxList>
							{(item) => (
								<ComboboxItem
									className="text-base"
									key={item}
									value={item}>
									{item}
								</ComboboxItem>
							)}
						</ComboboxList>
					</ComboboxContent>
				</Combobox>
			)}
		/>
	);
}
