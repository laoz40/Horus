"use client";

import { type ReactElement } from "react";
import { useMutation } from "@tanstack/react-query";
import { IconTrash } from "@tabler/icons-react";
import { type ControllerRenderProps, Controller, useFormContext, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { type Workout, validateCompletedSet } from "@/features/workout-form/lib/validateWorkout";
import { orpc } from "@/lib/orpc/client";
import { startRestTimer } from "@/features/workout-form/stores/workoutFormUiStore";
import { showSetPrToast } from "@/lib/toastMessages";
import NumberInput from "@/features/workout-form/components/NumberInput";
import { cn } from "@/lib/utils";

interface SetRowProps {
	exerciseIndex: number;
	setIndex: number;
	isEditing: boolean;
	onDeleteSet: (setIndex: number) => void;
}

// Convert blank inputs to undefined instead of nan, so empty fields stay empty in RHF.
// DOM events hand us strings, but editing an existing workout pre-fills numbers.
const parseOptionalNumber = (value: string | number | null): number | undefined => {
	const trimmed = String(value ?? "").trim();

	if (trimmed === "") return undefined;

	const parsedValue = Number(trimmed);

	return Number.isFinite(parsedValue) ? parsedValue : undefined;
};

type CompletedFieldName = `exercises.${number}.sets.${number}.completed`;

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

	const checkSetPrMutation = useMutation(
		orpc.exercises.checkSetPr.mutationOptions({
			onSuccess: (result, input) => {
				if (!result.prType) return;

				showSetPrToast(input.exerciseName, result.prType);
			},
		}),
	);

	const fields = {
		completed: `exercises.${exerciseIndex}.sets.${setIndex}.completed`,
		weight: `exercises.${exerciseIndex}.sets.${setIndex}.weight`,
		reps: `exercises.${exerciseIndex}.sets.${setIndex}.reps`,
		exerciseName: `exercises.${exerciseIndex}.global.name`,
		sets: `exercises.${exerciseIndex}.sets`,
	} as const;

	const isChecked = useWatch({ control, name: fields.completed, defaultValue: false });

	function validateSetCompletion(): boolean {
		// Field-level RHF trigger is not enough here because draft sets allow empty reps;
		// the submit schema only requires reps later at the exercise level. Checkbox
		// completion needs an immediate per-set Zod check so blank rows cannot be checked.
		const result = validateCompletedSet(getValues(fields.sets)?.[setIndex]);

		if (result.success) {
			clearErrors([fields.reps, fields.weight]);

			return true;
		}

		const repsIssue = result.error.issues.find((issue) => issue.path[0] === "reps");
		const weightIssue = result.error.issues.find((issue) => issue.path[0] === "weight");

		if (repsIssue) {
			setError(fields.reps, { type: "zod", message: repsIssue.message });
		}

		if (weightIssue) {
			setError(fields.weight, { type: "zod", message: weightIssue.message });
		}

		return false;
	}

	function handleCompletedChange(
		value: boolean | "indeterminate",
		field: ControllerRenderProps<Workout, CompletedFieldName>,
	): void {
		const nextChecked = !!value;
		const previousChecked = field.value;

		if (nextChecked && !validateSetCompletion()) {
			field.onChange(false);

			return;
		}

		field.onChange(nextChecked);

		if (previousChecked || !nextChecked) return;

		startRestTimer();

		const exerciseName = getValues(fields.exerciseName)?.trim();

		if (!exerciseName) return;

		const sets = getValues(fields.sets);
		const currentSet = sets?.[setIndex];

		if (!currentSet || currentSet.reps === undefined) return;

		const setsForPrCheck = sets.map((set, index) => ({
			completed: index === setIndex ? true : set.completed,
			reps: set.reps,
			weight: set.weight,
		}));

		// If the PR check fails, keep the set completed and skip only the PR toast.
		checkSetPrMutation.mutate({
			exerciseName,
			sets: setsForPrCheck,
			setIndex,
		});
	}

	let action: ReactElement;

	if (isEditing) {
		action = (
			<div className="ml-4 flex items-center justify-center text-destructive">
				<Button
					variant="ghost"
					className="size-7"
					type="button"
					onClick={() => onDeleteSet(setIndex)}>
					<IconTrash className="size-5" />
				</Button>
			</div>
		);
	} else {
		action = (
			<Controller
				name={fields.completed}
				control={control}
				defaultValue={false}
				render={({ field }) => (
					<Checkbox
						className="ml-4 size-7 bg-card"
						iconClassName="size-5"
						aria-label="Color success"
						checked={field.value}
						onCheckedChange={(value) => handleCompletedChange(value, field)}
					/>
				)}
			/>
		);
	}

	const inputClassName = cn(
		"h-11 bg-card text-2xl text-foreground",
		isChecked && "border-primary text-primary",
	);

	const separatorClassName = cn("text-base", isChecked ? "text-primary" : "text-muted-foreground");
	const repsErrorMessage = errors.exercises?.[exerciseIndex]?.sets?.[setIndex]?.reps?.message;

	return (
		<div className="flex flex-col gap-1">
			<div className="grid grid-cols-[1fr_min-content_1fr_min-content] place-items-center gap-5">
				<NumberInput
					variant="decimal"
					placeholder="kg"
					className={inputClassName}
					maxLength={6}
					{...register(fields.weight, { setValueAs: parseOptionalNumber })}
				/>
				<span className={separatorClassName}>×</span>
				<NumberInput
					variant="integer"
					placeholder="reps"
					className={inputClassName}
					maxLength={6}
					{...register(fields.reps, { setValueAs: parseOptionalNumber })}
				/>
				{action}
			</div>
			{(repsErrorMessage?.length ?? 0) > 0 && (
				<span className="text-sm text-destructive">{repsErrorMessage}</span>
			)}
		</div>
	);
}
