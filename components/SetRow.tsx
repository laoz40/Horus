import { Workout } from "@/lib/validateWorkout";
import { Trash } from "lucide-react";
import { type ReactElement } from "react";
import { useFormContext } from "react-hook-form";
import NumberInput from "./NumberInput";
import { Checkbox } from "./ui/checkbox";

interface SetRowProps {
	key: string;
	exerciseIndex: number;
	setIndex: number;
	isEditing: boolean;
}

export default function SetRow({
	exerciseIndex,
	setIndex,
	isEditing,
}: SetRowProps): ReactElement {
	const {
		register,
		formState: { errors },
	} = useFormContext<Workout>();

	return (
		<>
			<div className="flex flex-col gap-1">
				<div className="grid grid-cols-[min-content_1fr_min-content_1fr_min-content] gap-5 place-items-center">
					<span className="text-muted-foreground text-xs">{setIndex + 1}</span>
					<NumberInput
						variant="decimal"
						placeholder="kg"
						className="text-xl h-11"
						{...register(`exercises.${exerciseIndex}.sets.${setIndex}.weight`, {
							valueAsNumber: true,
						})}
					/>
					<span className="text-muted-foreground">×</span>
					<NumberInput
						variant="integer"
						placeholder="reps"
						className="text-xl h-11"
						{...register(`exercises.${exerciseIndex}.sets.${setIndex}.reps`, {
							valueAsNumber: true,
						})}
					/>
					{isEditing ? (
						<div className="h-6 w-6 ml-4 flex items-center justify-center text-destructive">
							<Trash />
						</div>
					) : (
						<Checkbox
							className="h-6 w-6 ml-4"
							aria-label="Color success"
						/>
					)}
				</div>
				{errors.exercises?.[exerciseIndex]?.sets?.[setIndex]?.reps && (
					<span className="text-red-500 text-sm">
						{errors.exercises?.[exerciseIndex]?.sets?.[setIndex]?.reps.message}
					</span>
				)}
			</div>
		</>
	);
}
