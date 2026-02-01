"use client";

import { cn } from "@/lib/utils";
import { Workout } from "@/lib/validateWorkout";
import { forwardRef, useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import ExerciseCollapsibles from "./ExerciseCollapsibles";
import InputNoBorder from "./InputNoBorder";
import SetRow from "./SetRow";
import { Button } from "./ui/button";

export interface ExerciseFormProps
	extends React.HTMLAttributes<HTMLDivElement> {
	exerciseIndex: number;
}

const ExerciseForm = forwardRef<HTMLDivElement, ExerciseFormProps>(
	({ className, exerciseIndex }, ref) => {
		const {
			register,
			getValues,
			formState: { errors },
		} = useFormContext<Workout>();

		const { fields, append, remove } = useFieldArray({
			name: `exercises.${exerciseIndex}.sets`,
		});

		const handleAddSet = () => {
			append({
				id: crypto.randomUUID(),
				weight: undefined,
				reps: undefined,
			});
		};

		const exerciseNames = [
			"Bench Press",
			"Lat Pulldown",
			"Seated Cable Row",
			"Cable Flyes",
			"Cable Crunches",
			"Leg Press",
			"Romanian Deadlifts",
			"Leg Extensions",
			"Hamstring Curls",
			"Calf Raises",
			"Bicep Curls",
			"Tricep Extensions",
		];

		const getExerciseName = getValues(`exercises.${exerciseIndex}.global.name`);

		const [isEditing, setIsEditing] = useState(false);

		return (
			<section
				ref={ref}
				className={cn("h-full flex flex-col gap-5 p-4", className)}>
				{/* Exercise Name */}
				<div className="flex flex-col gap-2">
					<InputNoBorder
						placeholder="Type an exercise..."
						className="text-2xl font-medium"
						{...register(`exercises.${exerciseIndex}.global.name`)}
						list="exercises"
					/>
					<datalist id="exercises">
						{exerciseNames.map((exercise: string) => (
							<option
								key={exercise}
								value={exercise}></option>
						))}
					</datalist>
					{errors.exercises?.[exerciseIndex]?.global?.name && (
						<span className="text-red-500 text-sm">
							{errors.exercises?.[exerciseIndex]?.global?.name?.message}
						</span>
					)}
				</div>

				{getExerciseName.trim() && (
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
								{fields.map((set, setIndex) => (
									<SetRow
										key={set.id}
										setIndex={setIndex}
										exerciseIndex={exerciseIndex}
										isEditing={isEditing}
										onRemoveSet={() => remove(setIndex)}
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
							{ // FIX: error doesn't dissappear when adding a new set
								errors.exercises?.[exerciseIndex]?.sets?.root?.message && (
								<span className="text-red-500 text-sm">
									{errors.exercises?.[exerciseIndex]?.sets?.root?.message}
								</span>
							)}
						</div>

						{/* Add Set Button */}
						{isEditing ? (
							<Button
								variant="destructive"
								className="w-full"
								type="button"
								onClick={() => console.log("delete")}>
								Delete Exercise
							</Button>
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
