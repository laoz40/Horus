import { ChangeEvent, type ReactElement } from "react";
import { Checkbox } from "./ui/checkbox";
import NumberInput from "./NumberInput";
import { ExerciseFormData } from "@/lib/types";

interface SetRowProps {
	key: string;
	index: number;
	set: { weight: string; reps: string };
	setExerciseData: (
		updaterFn: (prev: ExerciseFormData) => ExerciseFormData,
	) => void;
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
			<div className="flex flex-col gap-1">
				<div className="grid grid-cols-[min-content_1fr_min-content_1fr_min-content] gap-5 place-items-center">
					<span className="text-muted-foreground text-xs">{index + 1}</span>
					<NumberInput
						variant="decimal"
						placeholder="kg"
						className="text-xl h-11"
						value={set.weight}
						onChange={handleWeightUpdate}
					/>
					<span className="text-muted-foreground">×</span>
					<NumberInput
						variant="integer"
						placeholder="reps"
						className="text-xl h-11"
						value={set.reps}
						onChange={handleRepsUpdate}
					/>
					<Checkbox
						className="h-11 w-11 ml-4"
						aria-label="Color success"
					/>
				</div>
			</div>
		</>
	);
}
