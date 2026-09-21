"use client";

import { IconPlus } from "@tabler/icons-react";
import { type Ref } from "react";
import { Button } from "@/components/ui/button";
import type { Workout } from "@/features/workout-form/lib/validateWorkout";
import { showSetDeletedToast } from "@/lib/toastMessages";
import { cn } from "@/lib/utils";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { createDefaultSet } from "@/features/workout-form/lib/WorkoutFormDefaults";
import ExerciseCollapsibles from "@/features/workout-form/components/ExerciseCollapsibles";
import { ExerciseNameInputDropdown } from "@/features/workout-form/components/ExerciseNameInputDropdown";
import { MuscleGroupExercisePicker } from "@/features/workout-form/components/MuscleGroupExercisePicker";
import SetRow from "@/features/workout-form/components/SetRow";

interface ExerciseFormProps extends React.HTMLAttributes<HTMLDivElement> {
	exerciseIndex: number;
	isEditing: boolean;
	ref?: Ref<HTMLDivElement>;
}

function ExerciseForm({ className, exerciseIndex, isEditing, ref }: ExerciseFormProps) {
	const {
		control,
		trigger,
		formState: { errors },
	} = useFormContext<Workout>();

	const {
		fields: sets,
		append,
		remove,
	} = useFieldArray({
		name: `exercises.${exerciseIndex}.sets`,
	});

	const handleAddSet = () => {
		append(createDefaultSet());
		void trigger(`exercises.${exerciseIndex}.sets`);
	};

	// BUG: when loading a workout to edit, adding new sets after deleting sets loads previous data
	const handleDeleteSet = (setIndex: number) => {
		const isLastSet = sets.length === 1;
		remove(setIndex);

		if (isLastSet) {
			append(createDefaultSet(), { shouldFocus: false });
		}

		showSetDeletedToast();
		void trigger(`exercises.${exerciseIndex}.sets`);
	};

	const exerciseName = useWatch({
		control,
		name: `exercises.${exerciseIndex}.global.name` as const,
	});

	const hasExerciseName = Boolean(exerciseName?.trim());

	const exerciseError = errors.exercises?.[exerciseIndex];
	const nameError = exerciseError?.global?.name;
	const setsError = exerciseError?.sets?.root;

	return (
		<section
			ref={ref}
			className={cn("flex min-h-full flex-col gap-3 p-4", className)}>
			{/* Exercise Name */}
			<div className="flex shrink-0 flex-col gap-2">
				<ExerciseNameInputDropdown exerciseIndex={exerciseIndex} />
				{nameError && <span className="text-sm text-red-500">{nameError.message}</span>}
			</div>

			{!hasExerciseName && (
				<div className="flex min-h-0 flex-1 flex-col">
					<MuscleGroupExercisePicker exerciseIndex={exerciseIndex} />
				</div>
			)}

			{hasExerciseName && (
				<div className="flex min-h-0 flex-1 flex-col gap-2">
					{/* Set Rows */}
					<div className="no-scrollbar -mx-1 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-1">
						<div className="flex flex-col gap-3 pt-0.5">
							{sets.map((set, setIndex) => (
								<SetRow
									key={set.id}
									setIndex={setIndex}
									exerciseIndex={exerciseIndex}
									isEditing={isEditing}
									onDeleteSet={handleDeleteSet}
								/>
							))}
						</div>
						<Button
							variant="ghost"
							className="w-full shrink-0 items-center text-sm leading-0 text-muted-foreground"
							type="button"
							onClick={handleAddSet}>
							<IconPlus className="size-4" />
							<span className="translate-y-px">Add Set</span>
						</Button>
						{setsError && <span className="text-sm text-red-500">{setsError.message}</span>}
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
