import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Workout } from "@/features/workout-form/lib/validateWorkout";
import { useWorkoutFormUiStore } from "@/features/workout-form/stores/workoutFormUiStore";
import { useFormContext, useWatch } from "react-hook-form";

interface ExerciseSelectorProps {
	exerciseIds: string[];
}

export default function ExerciseSelector({ exerciseIds }: ExerciseSelectorProps) {
	const { control } = useFormContext<Workout>();
	const selectedExerciseId = useWorkoutFormUiStore((state) => state.selectedExerciseId);
	const selectExercise = useWorkoutFormUiStore((state) => state.selectExercise);
	const setScrollTarget = useWorkoutFormUiStore((state) => state.setScrollTarget);

	// map names of exercises from the form
	const exerciseNames = useWatch({
		control,
		name: exerciseIds.map((_, exerciseIndex) => `exercises.${exerciseIndex}.global.name` as const),
	}) as Array<string | undefined>;

	// match selected id to get index and name
	const selectedExerciseIndex = exerciseIds.findIndex((exerciseId) => exerciseId === selectedExerciseId);
	const selectedExerciseLabel =
		selectedExerciseIndex >= 0
			? `${selectedExerciseIndex + 1}: ${
					exerciseNames[selectedExerciseIndex]?.trim() || "No exercise added"
				}`
			: "Select exercise";

	return (
		<Select
			value={selectedExerciseId ?? ""}
			onValueChange={(value) => {
				const nextExerciseId = value || null;
				selectExercise(nextExerciseId);
				setScrollTarget(nextExerciseId);
			}}>
			<SelectTrigger className="w-full">
				<SelectValue>{selectedExerciseLabel}</SelectValue>
			</SelectTrigger>
			<SelectContent position="popper">
				<SelectGroup>
					<SelectLabel>Exercises</SelectLabel>
					{exerciseIds.map((exerciseId, exerciseIndex) => (
						<SelectItem
							key={exerciseId}
							value={exerciseId}>
							{exerciseIndex + 1}: {exerciseNames[exerciseIndex]?.trim() || "No exercise added"}
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}
