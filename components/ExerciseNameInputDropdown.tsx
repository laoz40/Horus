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

export function ExerciseNameInputDropdown({
	exerciseIndex,
}: {
	exerciseIndex: number;
}) {
	const exerciseNames = [
		"Bench Press",
		"Lat Pulldown",
		"Seated Cable Row",
		"Cable Flyes",
		"Cable Crunches",
		"Leg Press",
		"Romanian Deadlifts",
		"Leg Extensions",
		"Hamstring Curls",
		"Calf Raises",
		"Bicep Curls",
		"Tricep Extensions",
	];

	const { control } = useFormContext<Workout>();

	return (
		<Controller
			name={`exercises.${exerciseIndex}.global.name`}
			control={control}
			render={({ field }) => (
				<Combobox
					items={exerciseNames}
					value={field.value}
					onValueChange={field.onChange}>
					<ComboboxInput
						placeholder="Enter an exercise..."
						className="text-2xl font-medium h-11"
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
