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
import { useFormContext, useWatch } from "react-hook-form";

interface ExerciseSelectorProps {
	exercises: { id: string }[];
	selectedExerciseId?: string;
	onValueChange: (value: string) => void;
}

export default function ExerciseSelector({
	exercises,
	selectedExerciseId,
	onValueChange,
}: ExerciseSelectorProps) {
	const { control } = useFormContext<Workout>();
	const exerciseNames = useWatch({
		control,
		name: exercises.map((_, exerciseIndex) => `exercises.${exerciseIndex}.global.name` as const),
	}) as Array<string | undefined>;

	return (
		<Select
			value={selectedExerciseId}
			onValueChange={onValueChange}>
			<SelectTrigger className="w-full">
				<SelectValue />
			</SelectTrigger>
			<SelectContent position="popper">
				<SelectGroup>
					<SelectLabel>Exercises</SelectLabel>
					{exercises.map((exercise, exerciseIndex) => (
						<SelectItem
							key={exercise.id}
							value={exercise.id}>
							{exerciseIndex + 1}: {exerciseNames[exerciseIndex]?.trim() || "No exercise added"}
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}
