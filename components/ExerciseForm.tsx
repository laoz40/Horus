"use client";

import { cn } from "@/lib/utils";
import { Workout } from "@/lib/validateWorkout";
import { forwardRef, useCallback, useEffect, useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { showSetDeletedToast } from "@/lib/toastMessages";
import ExerciseCollapsibles from "./ExerciseCollapsibles";
import SetRow from "./SetRow";
import { Button } from "./ui/button";
import { AlertDialogDestructive } from "./DeleteWorkoutDialog";
import { ExerciseNameInputDropdown } from "./ExerciseNameInputDropdown";

export interface ExerciseFormProps
	extends React.HTMLAttributes<HTMLDivElement> {
	exerciseIndex: number;
	handleDeleteExercise: () => void;
}

const ExerciseForm = forwardRef<HTMLDivElement, ExerciseFormProps>(
	({ className, exerciseIndex, handleDeleteExercise }, ref) => {
		const {
			getValues,
			trigger,
			// watch,
			formState: { errors },
		} = useFormContext<Workout>();

		const {
			fields: sets,
			append,
			remove,
		} = useFieldArray({
			name: `exercises.${exerciseIndex}.sets`,
		});

		// console.log(watch(`exercises.${exerciseIndex}.sets`));

		const handleAddSet = useCallback(() => {
			append({
				id: crypto.randomUUID(),
				weight: undefined,
				reps: undefined,
				completed: false,
			});
			trigger(`exercises.${exerciseIndex}.sets`);
		}, [append, exerciseIndex, trigger]);

		useEffect(() => {
			if (sets.length === 0) {
				handleAddSet();
			}
		}, [sets.length, handleAddSet]);

		// BUG: when loading a workout to edit, adding new sets after deleting sets loads previous data
		const handleDeleteSet = (setIndex: number) => {
			remove(setIndex);
			showSetDeletedToast();
		};

		const getExerciseName = getValues(`exercises.${exerciseIndex}.global.name`);

		const [isEditing, setIsEditing] = useState(false);

		return (
			<section
				ref={ref}
				className={cn("h-full flex flex-col gap-5 p-4", className)}>
				{/* Exercise Name */}
				<div className="flex flex-col gap-2">
					<ExerciseNameInputDropdown exerciseIndex={exerciseIndex} />
					{errors.exercises?.[exerciseIndex]?.global?.name && (
						<span className="text-red-500 text-sm">
							{errors.exercises?.[exerciseIndex]?.global?.name?.message}
						</span>
					)}
				</div>

				{getExerciseName && (
					<div className="h-full flex flex-col gap-2">
						{/* Recent + Edit Buttons */}
						<div className="flex flex-row justify-between text-xs">
							<Button
								variant="secondary"
								size="sm"
								type="button"
								className="text-muted-foreground text-xs">
								Recent
							</Button>
							{isEditing ? (
								<Button
									variant="default"
									size="sm"
									type="button"
									className="text-muted-foreground w-12"
									onClick={() => setIsEditing(!isEditing)}>
									<div className="flex flex-row items-center justify-center gap-1 text-xs text-primary-foreground">
										Done
									</div>
								</Button>
							) : (
								<Button
									variant="secondary"
									size="sm"
									type="button"
									className="text-muted-foreground w-12"
									onClick={() => setIsEditing(!isEditing)}>
									<div className="flex flex-row items-center justify-center gap-1 text-xs">
										Edit
									</div>
								</Button>
							)}
						</div>

						{/* Set Rows */}
						<div className="flex flex-col overflow-y-auto no-scrollbar grow gap-3">
							<div className="flex flex-col gap-3 pt-0.5">
								{sets.map((set, setIndex) => (
									<SetRow
										key={set.id}
										setIndex={setIndex}
										exerciseIndex={exerciseIndex}
										isEditing={isEditing}
										handleDeleteSet={() => handleDeleteSet(setIndex)}
									/>
								))}
							</div>
							<Button
								variant="ghost"
								className="w-full text-muted-foreground text-sm"
								type="button"
								onClick={handleAddSet}>
								Add Set
							</Button>
							{errors.exercises?.[exerciseIndex]?.sets?.root?.message && (
								<span className="text-red-500 text-sm">
									{errors.exercises?.[exerciseIndex]?.sets?.root?.message}
								</span>
							)}
						</div>

						{/* Add Set Button */}
						{isEditing ? (
							<AlertDialogDestructive
								handleDelete={handleDeleteExercise}
								title="Delete exercise?"
								description="This will permanently delete the exercise.">
								<Button
									variant="destructive"
									className="w-full"
									type="button">
									Delete Exercise
								</Button>
							</AlertDialogDestructive>
						) : (
							<Button
								variant="secondary"
								className="w-full"
								type="button"
								onClick={handleAddSet}>
								Add Set
							</Button>
						)}

						{/* Difficulty and Notes */}
						<ExerciseCollapsibles exerciseIndex={exerciseIndex} />
					</div>
				)}
			</section>
		);
	},
);

ExerciseForm.displayName = "ExerciseForm";

export default ExerciseForm;
