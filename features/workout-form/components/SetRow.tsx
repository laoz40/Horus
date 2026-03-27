"use client";

import { Workout } from "@/features/workout-form/lib/validateWorkout";
import { Trash } from "lucide-react";
import { type ReactElement } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import NumberInput from "./NumberInput";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

interface SetRowProps {
	exerciseIndex: number;
	setIndex: number;
	isEditing: boolean;
	onDeleteSet: (setIndex: number) => void;
}

// Convert blank inputs to undefined instead of nan, so empty fields stay empty in RHF
const parseOptionalNumber = (value: unknown): number | undefined => {
	if (typeof value === "number") {
		return Number.isFinite(value) ? value : undefined;
	}

	if (typeof value !== "string") return undefined;

	const trimmed = value.trim();
	if (trimmed === "") return undefined;

	const parsedValue = Number(trimmed);
	return Number.isFinite(parsedValue) ? parsedValue : undefined;
};

export default function SetRow({
	exerciseIndex,
	setIndex,
	isEditing,
	onDeleteSet,
}: SetRowProps): ReactElement {

	const {
		register,
		control,
		formState: { errors },
	} = useFormContext<Workout>();

	const completedFieldName = `exercises.${exerciseIndex}.sets.${setIndex}.completed` as const;
	const weightFieldName = `exercises.${exerciseIndex}.sets.${setIndex}.weight` as const;
	const repsFieldName = `exercises.${exerciseIndex}.sets.${setIndex}.reps` as const;

	const isChecked = useWatch({ control, name: completedFieldName, defaultValue: false });

	const handleDeleteSet = () => {
		onDeleteSet(setIndex);
	};

	return (
		<>
			<div className="flex flex-col gap-1">
				<div className="grid grid-cols-[min-content_1fr_min-content_1fr_min-content] gap-5 place-items-center">
					<span
						className={`text-muted-foreground text-sm ${isChecked ? "text-primary" : "text-muted-foreground"}`}>
						{setIndex + 1}
					</span>
					<NumberInput
						variant="decimal"
						placeholder="kg"
						className="text-2xl h-11"
						{...register(weightFieldName, { setValueAs: parseOptionalNumber })}
					/>
					<span
						className={`text-muted-foreground text-sm ${isChecked ? "text-primary" : "text-muted-foreground"}`}>
						×
					</span>
					<NumberInput
						variant="integer"
						placeholder="reps"
						className="text-2xl h-11"
						{...register(repsFieldName, { setValueAs: parseOptionalNumber })}
					/>
					{isEditing ? (
						<div className="ml-4 flex items-center justify-center text-destructive">
							<Button
								variant="ghost"
								size="icon-sm"
								type="button"
								onClick={handleDeleteSet}>
								<Trash className="size-5"/>
							</Button>
						</div>
					) : (
						<Controller
							name={completedFieldName}
							control={control}
							defaultValue={false}
							render={({ field }) => (
								<Checkbox
									className="size-8 ml-4"
									aria-label="Color success"
									checked={field.value}
									onCheckedChange={(value) => field.onChange(!!value)}
								/>
							)}
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
