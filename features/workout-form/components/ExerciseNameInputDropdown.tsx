import { Controller, useFormContext } from "react-hook-form";
import {
	Combobox,
	ComboboxContent,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@/components/ui/combobox";
import { Workout } from "@/features/workout-form/lib/validateWorkout";
import { useState } from "react";
import { useExerciseSuggestions } from "@/features/workout-form/hooks/useExerciseSuggestions";

export function ExerciseNameInputDropdown({
	exerciseIndex,
}: {
	exerciseIndex: number;
}) {
	const { control, getValues, setValue } = useFormContext<Workout>();
	const getExerciseName = getValues(`exercises.${exerciseIndex}.global.name`);
	const [query, setQuery] = useState<string>(getExerciseName ?? "");
	const {
		suggestions,
		isDbSearchLoading,
		isOnlineSearchLoading,
		fetchMoreSuggestions,
	} = useExerciseSuggestions(query);

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
						maxLength={64}
						value={query}
						onChange={(e) => {
							setQuery(e.target.value ?? "");
							// reset muscle groups when typing in the input
							setValue(`exercises.${exerciseIndex}.global.muscleGroups`, []);
						}}
						onBlur={() => field.onChange(query)}
					/>
					<ComboboxContent className="min-w-(--anchor-width)">
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
									disabled={isDbSearchLoading || isOnlineSearchLoading}
									onClick={fetchMoreSuggestions}>
									{isDbSearchLoading
										? "Searching database..."
										: isOnlineSearchLoading
											? "Loading..."
											: "Search Online"}
								</button>
							)}
						</ComboboxList>
					</ComboboxContent>
				</Combobox>
			)}
		/>
	);
}
