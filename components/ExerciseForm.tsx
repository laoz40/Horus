"use client";

import { cn } from "@/lib/utils";
import { Workout } from "@/lib/validateWorkout";
import { Check, Edit, History } from "lucide-react";
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
			formState: { errors },
		} = useFormContext<Workout>();

		const { fields, append } = useFieldArray({
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

		const [exerciseNameBlurred, setExerciseNameBlurred] = useState(false);

		const [isEditing, setIsEditing] = useState(false);

		return (
			<section
				ref={ref}
				className={cn("h-full flex flex-col gap-4 p-4", className)}>
				{/* Exercise Name */}
				<InputNoBorder
					placeholder="Type an exercise..."
					className="text-2xl font-medium"
					{...register(`exercises.${exerciseIndex}.global.name`)}
					onBlur={() => setExerciseNameBlurred(true)}
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

				{
					/*	{exerciseNameBlurred && exerciseData.name.trim() && ( */
					<div className="h-full flex flex-col gap-1">
						{/* Recent + Edit Buttons */}
						<div className="flex flex-row justify-between text-xs">
							<Button
								variant="ghost"
								size="sm"
								type="button"
								className="text-muted-foreground p-0!">
								<History />
								Recent
							</Button>
							<Button
								variant="ghost"
								size="sm"
								type="button"
								className="text-muted-foreground p-0!"
								onClick={() => setIsEditing(!isEditing)}>
								{isEditing ? (
									<div className="flex flex-row items-center justify-center gap-1">
										<Check />
										Done
									</div>
								) : (
									<div className="flex flex-row items-center justify-center gap-1">
										<Edit />
										Edit
									</div>
								)}
							</Button>
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
									/>
								))}
							</div>
							{/* NOTE: need to test this when deleting sets is added */}
							{errors.exercises?.[exerciseIndex]?.sets?.message && (
								<span className="text-red-500 text-sm">
									{errors.exercises?.[exerciseIndex]?.sets?.message}
								</span>
							)}
							<Button
								variant="ghost"
								className="w-full text-muted-foreground"
								type="button"
								onClick={handleAddSet}>
								Add Set
							</Button>
						</div>

						{/* Add Set Button */}
						<Button
							variant="secondary"
							className="w-full"
							type="button"
							onClick={handleAddSet}>
							Add Set
						</Button>

						{/* Difficulty and Notes */}
						<ExerciseCollapsibles exerciseIndex={exerciseIndex} />
					</div>
				}
			</section>
		);
	},
);

ExerciseForm.displayName = "ExerciseForm";

export default ExerciseForm;
