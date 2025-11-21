import { ChangeEvent, type ReactElement } from "react";
import { Checkbox } from "./ui/checkbox";
import NumberInput from "./number-input";
import { Exercise } from "./ExerciseForm";

interface SetRowProps {
	key: string;
	index: number;
	set: { weight: string; reps: string };
	setExerciseData: (updaterFn: (prev: Exercise) => Exercise) => void;
}

export default function SetRow({
	index,
	set,
	setExerciseData,
}: SetRowProps): ReactElement {
	const handleWeightUpdate = (input: ChangeEvent<HTMLInputElement>) => {
		setExerciseData((prev) => {
			const setsData = [...prev.sets];
			setsData[index] = { ...setsData[index], weight: input.target.value };
			return { ...prev, sets: setsData };
		});
	};

	const handleRepsUpdate = (input: ChangeEvent<HTMLInputElement>) => {
		setExerciseData((prev) => {
			const setsData = [...prev.sets];
			setsData[index] = { ...setsData[index], reps: input.target.value };
			return { ...prev, sets: setsData };
		});
	};

	return (
		<>
			<div className="grid grid-cols-[min-content_0.3fr_1fr_0.3fr_1fr] place-items-center gap-4">
				<span className="text-muted-foreground text-xs">{index + 1}</span>
				<Checkbox
					className="h-6 w-6"
					aria-label="Color success"
				/>
				<NumberInput
					variant="decimal"
					placeholder="kg"
					className="text-xl h-12"
					value={set.weight}
					onChange={handleWeightUpdate}
				/>
				<span className="text-muted-foreground">×</span>
				<NumberInput
					variant="integer"
					placeholder="reps"
					className="text-xl h-12"
					value={set.reps}
					onChange={handleRepsUpdate}
				/>
			</div>
		</>
	);
}
