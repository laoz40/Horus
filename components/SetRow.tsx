import { type ReactElement } from "react";
import { Checkbox } from "./ui/checkbox";
import NumberInput from "./number-input";
import { Exercise } from "./exercise-form";

interface SetRowProps {
	key: number;
	index: number;
	set: { weight: string; reps: string };
	exerciseData: Exercise;
	setExerciseData: React.Dispatch<React.SetStateAction<Exercise>>;
}

export default function SetRow({
	index,
	set,
	setExerciseData,
}: SetRowProps): ReactElement {
	const updateWeight = (value: string) => {
		setExerciseData((prev) => {
			const setsData = [...prev.sets];
			setsData[index] = { ...setsData[index], weight: value };
			return { ...prev, sets: setsData };
		});
	};

	const updateReps = (value: string) => {
		setExerciseData((prev) => {
			const setsData = [...prev.sets];
			setsData[index] = { ...setsData[index], reps: value };
			return { ...prev, sets: setsData };
		});
	};

	return (
		<>
			<div className="grid grid-cols-[min-content_0.3fr_1fr_0.3fr_1fr] place-items-center gap-4">
				<span className="text-muted-foreground text-xs">1</span>
				<Checkbox
					className="h-6 w-6"
					aria-label="Color success"
				/>
				<NumberInput
					variant="decimal"
					placeholder="kg"
					className="text-xl h-12"
					value={set.weight}
					onChange={(input) => updateWeight(input.target.value)}
				/>
				<span className="text-muted-foreground">×</span>
				<NumberInput
					variant="integer"
					placeholder="reps"
					className="text-xl h-12"
					value={set.reps}
					onChange={(input) => updateReps(input.target.value)}
				/>
			</div>
		</>
	);
}
