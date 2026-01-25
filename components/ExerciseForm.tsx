"use client";

import { forwardRef, useState } from "react";
import ExerciseCollapsibles from "./ExerciseCollapsibles";
import { Button } from "./ui/button";
import { Edit, History } from "lucide-react";
import SetRow from "./SetRow";
import { cn } from "@/lib/utils";
import InputNoBorder from "./InputNoBorder";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Workout } from "@/lib/validateWorkout";

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
			append({ weight: null, reps: null });
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
								className="text-muted-foreground p-0!">
								<Edit />
								Edit
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
