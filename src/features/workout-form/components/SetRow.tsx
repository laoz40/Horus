"use client";

import { type ReactElement } from "react";
import { useMutation } from "@tanstack/react-query";
import { IconTrash } from "@tabler/icons-react";
import {
	type Control,
	type ControllerRenderProps,
	type UseFormClearErrors,
	type UseFormGetValues,
	type UseFormSetError,
	Controller,
	useFormContext,
	useWatch,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	type Workout,
	validateCompletedSet,
} from "@/features/workout-form/lib/validateWorkout";
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

type ExerciseNameFieldName = `exercises.${number}.global.name`;

type ExerciseSetsFieldName = `exercises.${number}.sets`;

type RepsFieldName = `exercises.${number}.sets.${number}.reps`;

type WeightFieldName = `exercises.${number}.sets.${number}.weight`;

interface ValidateSetCompletionParams {
	setIndex: number;
	exerciseSetsFieldName: ExerciseSetsFieldName;
	repsFieldName: RepsFieldName;
	weightFieldName: WeightFieldName;
	getValues: UseFormGetValues<Workout>;
	setError: UseFormSetError<Workout>;
	clearErrors: UseFormClearErrors<Workout>;
}

function validateSetCompletion({
	setIndex,
	exerciseSetsFieldName,
	repsFieldName,
	weightFieldName,
	getValues,
	setError,
	clearErrors,
}: ValidateSetCompletionParams): boolean {
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
}

interface ApplySetCompletedChangeParams extends ValidateSetCompletionParams {
	value: boolean | "indeterminate";
	field: ControllerRenderProps<Workout, CompletedFieldName>["field"];
	exerciseNameFieldName: ExerciseNameFieldName;
	checkSetPr: (input: {
		exerciseName: string;
		sets: { completed: boolean; reps?: number; weight?: number }[];
		setIndex: number;
	}) => void;
}

function applySetCompletedChange({
	value,
	field,
	setIndex,
	exerciseNameFieldName,
	exerciseSetsFieldName,
	repsFieldName,
	weightFieldName,
	getValues,
	setError,
	clearErrors,
	checkSetPr,
}: ApplySetCompletedChangeParams): void {
	const nextChecked = !!value;
	const previousChecked = field.value;

	if (
		nextChecked &&
		!validateSetCompletion({
			setIndex,
			exerciseSetsFieldName,
			repsFieldName,
			weightFieldName,
			getValues,
			setError,
			clearErrors,
		})
	) {
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

	// If the PR check fails, keep the set completed and skip only the PR toast.
	checkSetPr({
		exerciseName,
		sets: setsForPrCheck,
		setIndex,
	});
}

interface SetRowActionsProps extends ValidateSetCompletionParams {
	isEditing: boolean;
	onDeleteSet: () => void;
	completedFieldName: CompletedFieldName;
	exerciseNameFieldName: ExerciseNameFieldName;
	control: Control<Workout>;
	checkSetPr: ApplySetCompletedChangeParams["checkSetPr"];
}

function SetRowActions({
	isEditing,
	onDeleteSet,
	completedFieldName,
	control,
	setIndex,
	exerciseNameFieldName,
	exerciseSetsFieldName,
	repsFieldName,
	weightFieldName,
	getValues,
	setError,
	clearErrors,
	checkSetPr,
}: SetRowActionsProps): ReactElement {
	if (isEditing) {
		return (
			<div className="ml-4 flex items-center justify-center text-destructive">
				<Button
					variant="ghost"
					className="size-7"
					type="button"
					onClick={onDeleteSet}>
					<IconTrash className="size-5" />
				</Button>
			</div>
		);
	}

	return (
		<Controller
			name={completedFieldName}
			control={control}
			defaultValue={false}
			render={({ field }) => (
				<Checkbox
					className="ml-4 size-7 bg-card dark:bg-input"
					iconClassName="size-5"
					aria-label="Color success"
					checked={field.value}
					onCheckedChange={(value) =>
						applySetCompletedChange({
							value,
							field,
							setIndex,
							exerciseNameFieldName,
							exerciseSetsFieldName,
							repsFieldName,
							weightFieldName,
							getValues,
							setError,
							clearErrors,
							checkSetPr,
						})
					}
				/>
			)}
		/>
	);
}

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

	const completedFieldName = `exercises.${exerciseIndex}.sets.${setIndex}.completed` as const;
	const weightFieldName = `exercises.${exerciseIndex}.sets.${setIndex}.weight` as const;
	const repsFieldName = `exercises.${exerciseIndex}.sets.${setIndex}.reps` as const;
	const exerciseNameFieldName = `exercises.${exerciseIndex}.global.name` as const;
	const exerciseSetsFieldName = `exercises.${exerciseIndex}.sets` as const;

	const isChecked = useWatch({ control, name: completedFieldName, defaultValue: false });

	const inputClassName = cn(
		"h-11 bg-card text-2xl text-foreground dark:bg-input",
		isChecked && "border-primary text-primary",
	);

	const separatorClassName = cn("text-base", isChecked ? "text-primary" : "text-muted-foreground");
	const repsErrorMessage = errors.exercises?.[exerciseIndex]?.sets?.[setIndex]?.reps?.message;

	return (
		<div className="flex flex-col gap-1">
			<div className="grid grid-cols-[1fr_min-content_1fr_min-content] gap-5 place-items-center">
				<NumberInput
					variant="decimal"
					placeholder="kg"
					className={inputClassName}
					maxLength={6}
					{...register(weightFieldName, { setValueAs: parseOptionalNumber })}
				/>
				<span className={separatorClassName}>×</span>
				<NumberInput
					variant="integer"
					placeholder="reps"
					className={inputClassName}
					maxLength={6}
					{...register(repsFieldName, { setValueAs: parseOptionalNumber })}
				/>
				<SetRowActions
					isEditing={isEditing}
					onDeleteSet={() => onDeleteSet(setIndex)}
					completedFieldName={completedFieldName}
					control={control}
					setIndex={setIndex}
					exerciseNameFieldName={exerciseNameFieldName}
					exerciseSetsFieldName={exerciseSetsFieldName}
					repsFieldName={repsFieldName}
					weightFieldName={weightFieldName}
					getValues={getValues}
					setError={setError}
					clearErrors={clearErrors}
					checkSetPr={checkSetPrMutation.mutate}
				/>
			</div>
			{repsErrorMessage ? <span className="text-red-500 text-sm">{repsErrorMessage}</span> : null}
		</div>
	);
}
