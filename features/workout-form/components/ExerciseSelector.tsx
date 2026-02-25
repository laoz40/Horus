import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface ExerciseSelectorProps {
	exercises: { id: string }[];
	selectedExerciseId?: string;
	onValueChange: (value: string) => void;
	getExerciseLabel: (exerciseIndex: number) => string;
}

export default function ExerciseSelector({
	exercises,
	selectedExerciseId,
	onValueChange,
	getExerciseLabel,
}: ExerciseSelectorProps) {
	return (
		<Select
			value={selectedExerciseId}
			onValueChange={onValueChange}>
			<SelectTrigger className="w-full">
				<SelectValue placeholder="No Exercise Added" />
			</SelectTrigger>
			<SelectContent position="popper">
				<SelectGroup>
					<SelectLabel>Exercises</SelectLabel>
					{exercises.map((exercise, exerciseIndex) => (
						<SelectItem
							key={exercise.id}
							value={exercise.id}>
							{exerciseIndex + 1}: {getExerciseLabel(exerciseIndex)}
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}
