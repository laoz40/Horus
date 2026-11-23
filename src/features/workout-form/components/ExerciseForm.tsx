"use client";

import { useWeightPlaceholder } from "@/features/workout-form/hooks/useWeightPlaceholder";
import { IconPlus } from "@tabler/icons-react";
import { type Ref } from "react";
import { Button } from "@/components/ui/button";
import type { Workout } from "@/features/workout-form/lib/validateWorkout";
import { showSetDeletedToast } from "@/lib/toastMessages";
import { cn } from "@/lib/utils";
import { useFieldArray, useFormContext, useFormState } from "react-hook-form";
import { createDefaultSet } from "@/features/workout-form/lib/WorkoutFormDefaults";
import ExerciseCollapsibles from "@/features/workout-form/components/ExerciseCollapsibles";
import { ExerciseNameInputDropdown } from "@/features/workout-form/components/ExerciseNameInputDropdown";
import { MuscleGroupExerciseBrowser } from "@/features/exercise-picker/components/MuscleGroupExerciseBrowser";
import { useExerciseNamePicker } from "@/features/workout-form/hooks/useExerciseNamePicker";
import type { RestTimerStore } from "@/features/workout-form/stores/restTimerStore";
import SetRow from "@/features/workout-form/components/SetRow";

interface ExerciseFormProps extends React.HTMLAttributes<HTMLDivElement> {
	restTimerStore: RestTimerStore;
	exerciseIndex: number;
	isEditing: boolean;
	ref?: Ref<HTMLDivElement>;
}

function ExerciseForm({
	className,
	exerciseIndex,
	isEditing,
	ref,
	restTimerStore,
}: ExerciseFormProps) {
	const { control } = useFormContext<Workout>();
	const { errors } = useFormState({ control });

	const {
		fields: sets,
		append,
		remove,
		replace,
	} = useFieldArray({
		name: `exercises.${exerciseIndex}.sets`,
	});

	const handleAddSet = () => {
		append(createDefaultSet(), {
			focusName: `exercises.${exerciseIndex}.sets.${sets.length}.weight`,
		});
	};

	const handleDeleteSet = (setIndex: number) => {
		if (sets.length === 1) {
			replace([createDefaultSet()]);
		} else {
			remove(setIndex);
		}

		showSetDeletedToast();
	};

	const picker = useExerciseNamePicker(exerciseIndex);
	const exerciseName = picker.field.value;
	const hasExerciseName = Boolean(exerciseName?.trim());

	const { weightPlaceholder, isWeightPlaceholderLoading } = useWeightPlaceholder(
		exerciseIndex,
		exerciseName ?? "",
	);

	const exerciseError = errors.exercises?.[exerciseIndex];
	const nameError = exerciseError?.global?.name;
	const setsError = exerciseError?.sets?.root;

	return (
		<section
			ref={ref}
			className={cn("flex min-h-full flex-col gap-3 p-4", className)}>
			{/* Exercise Name */}
			<div className="flex shrink-0 flex-col gap-2">
				<ExerciseNameInputDropdown picker={picker} />
				{nameError && <span className="text-sm text-destructive">{nameError.message}</span>}
			</div>

			{!hasExerciseName && (
				<div className="flex min-h-0 flex-1 flex-col">
					<MuscleGroupExerciseBrowser
						onSelectExercise={(exercise) => void picker.send({ kind: "select", exercise })}
					/>
				</div>
			)}

			{hasExerciseName && (
				<div className="flex min-h-0 flex-1 flex-col gap-2">
					{/* Set Rows */}
					<div className="no-scrollbar -mx-1 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-1">
						<div className="flex flex-col gap-3 pt-0.5">
							{sets.map((set, setIndex) => (
								<SetRow
									restTimerStore={restTimerStore}
									key={set.id}
									setIndex={setIndex}
									exerciseIndex={exerciseIndex}
									isEditing={isEditing}
									weightPlaceholder={weightPlaceholder}
									isWeightPlaceholderLoading={isWeightPlaceholderLoading}
									onDeleteSet={handleDeleteSet}
								/>
							))}
						</div>
						<Button
							variant="ghost"
							className="w-full shrink-0 items-center leading-0 text-muted-foreground"
							type="button"
							onClick={handleAddSet}>
							<IconPlus className="size-4" />
							<span className="translate-y-px">Add Set</span>
						</Button>
						{setsError && <span className="text-sm text-destructive">{setsError.message}</span>}
					</div>

					{/* Difficulty and Notes */}
					<div className="shrink-0">
						<ExerciseCollapsibles exerciseIndex={exerciseIndex} />
					</div>
				</div>
			)}
		</section>
	);
}

export default ExerciseForm;
