"use client";

import { type ReactElement } from "react";
import { Trash } from "lucide-react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { type Workout, validateCompletedSet } from "@/features/workout-form/lib/validateWorkout";
import { orpc } from "@/lib/orpc/client";
import { startRestTimer } from "@/features/workout-form/stores/workoutFormUiStore";
import { showSetPrToast } from "@/lib/toastMessages";
import { tryCatch } from "@/lib/tryPromise";
import NumberInput from "./NumberInput";

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
		getValues,
		setError,
		clearErrors,
		formState: { errors },
	} = useFormContext<Workout>();
	const completedFieldName = `exercises.${exerciseIndex}.sets.${setIndex}.completed` as const;
	const weightFieldName = `exercises.${exerciseIndex}.sets.${setIndex}.weight` as const;
	const repsFieldName = `exercises.${exerciseIndex}.sets.${setIndex}.reps` as const;
	const exerciseNameFieldName = `exercises.${exerciseIndex}.global.name` as const;
	const exerciseSetsFieldName = `exercises.${exerciseIndex}.sets` as const;

	const isChecked = useWatch({ control, name: completedFieldName, defaultValue: false });

	const validateCurrentSetForCompletion = (): boolean => {
		// Field-level RHF trigger is not enough here because draft sets allow empty reps;
		// the submit schema only requires reps later at the exercise level. Checkbox
		// completion needs an immediate per-set Zod check so blank rows cannot be checked.
		const result = validateCompletedSet(getValues(exerciseSetsFieldName)?.[setIndex]);

		if (result.success) {
			clearErrors([repsFieldName, weightFieldName]);
			return true;
		}

		const repsIssue = result.error.issues.find((issue) => issue.path[0] === "reps");
		const weightIssue = result.error.issues.find((issue) => issue.path[0] === "weight");

		if (repsIssue) {
			setError(repsFieldName, { type: "zod", message: repsIssue.message });
		}

		if (weightIssue) {
			setError(weightFieldName, { type: "zod", message: weightIssue.message });
		}

		return false;
	};

	const handleDeleteSet = () => {
		onDeleteSet(setIndex);
	};

	return (
		<>
			<div className="flex flex-col gap-1">
				<div className="grid grid-cols-[1fr_min-content_1fr_min-content] gap-5 place-items-center">
					<NumberInput
						variant="decimal"
						placeholder="kg"
						className="h-11 bg-card text-2xl text-foreground dark:bg-input"
						maxLength={6}
						{...register(weightFieldName, { setValueAs: parseOptionalNumber })}
					/>
					<span
						className={`text-muted-foreground text-base ${isChecked ? "text-primary" : "text-muted-foreground"}`}>
						×
					</span>
					<NumberInput
						variant="integer"
						placeholder="reps"
						className="h-11 bg-card text-2xl text-foreground dark:bg-input"
						maxLength={6}
						{...register(repsFieldName, { setValueAs: parseOptionalNumber })}
					/>
					{isEditing ? (
						<div className="ml-4 flex items-center justify-center text-destructive">
							<Button
								variant="ghost"
								size="icon-lg"
								className="h-11 w-11"
								type="button"
								onClick={handleDeleteSet}>
								<Trash className="size-6" />
							</Button>
						</div>
					) : (
						<Controller
							name={completedFieldName}
							control={control}
							defaultValue={false}
							render={({ field }) => (
								<Checkbox
									className="ml-4 size-11 bg-card dark:bg-input"
									iconClassName="size-6"
									aria-label="Color success"
									checked={field.value}
									onCheckedChange={async (value) => {
										const nextChecked = !!value;
										const previousChecked = !!field.value;
										if (nextChecked && !validateCurrentSetForCompletion()) {
											field.onChange(false);
											return;
										}

										field.onChange(nextChecked);

										if (previousChecked || !nextChecked) return;

										startRestTimer();

										const exerciseName = getValues(exerciseNameFieldName)?.trim();
										if (!exerciseName) return;

										const sets = getValues(exerciseSetsFieldName);
										const currentSet = sets?.[setIndex];
										if (!currentSet || currentSet.reps === undefined) return;

										const setsForPrCheck = sets.map((set, index) => ({
											completed: index === setIndex ? true : set.completed,
											reps: set.reps,
											weight: set.weight,
										}));

										const result = await tryCatch(() =>
											orpc.exercises.checkSetPr.call({
												exerciseName,
												sets: setsForPrCheck,
												setIndex,
											}),
										);

										// PR feedback is optional, so a failed check does not undo set completion.
										if (result.isErr()) return;

										if (result.value.prType) {
											showSetPrToast(exerciseName, result.value.prType);
										}
									}}
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
