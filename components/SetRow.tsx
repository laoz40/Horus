import { type ReactElement } from "react";
import { Checkbox } from "./ui/checkbox";
import NumberInput from "./NumberInput";
import { useFormContext } from "react-hook-form";

interface SetRowProps {
	key: string;
	exerciseIndex: number;
	setIndex: number;
}

export default function SetRow({
	exerciseIndex,
	setIndex,
}: SetRowProps): ReactElement {

	const { register } = useFormContext()

	return (
		<>
			<div className="flex flex-col gap-1">
				<div className="grid grid-cols-[min-content_1fr_min-content_1fr_min-content] gap-5 place-items-center">
					<span className="text-muted-foreground text-xs">{setIndex + 1}</span>
					<NumberInput
						variant="decimal"
						placeholder="kg"
						className="text-xl h-11"
						{...register(`exercises.${exerciseIndex}.sets.${setIndex}.weight`)}
					/>
					<span className="text-muted-foreground">×</span>
					<NumberInput
						variant="integer"
						placeholder="reps"
						className="text-xl h-11"
						{...register(`exercises.${exerciseIndex}.sets.${setIndex}.reps`)}
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
