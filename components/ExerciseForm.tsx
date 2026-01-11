"use client";

import { ChangeEvent, forwardRef, useState } from "react";
import ExerciseCollapsibles from "./ExerciseCollapsibles";
import { Button } from "./ui/button";
import { Edit, History } from "lucide-react";
import SetRow from "./SetRow";
import { cn } from "@/lib/utils";
import { ExerciseFormData } from "@/lib/types";
import InputNoBorder from "./InputNoBorder";

export interface ExerciseFormProps
	extends React.HTMLAttributes<HTMLDivElement> {
	exerciseData: ExerciseFormData;
	setExerciseData: (
		updaterFn: (prev: ExerciseFormData) => ExerciseFormData,
	) => void;
}

const ExerciseForm = forwardRef<HTMLDivElement, ExerciseFormProps>(
	({ exerciseData, setExerciseData, className }, ref) => {
		const handleNameUpdate = (input: ChangeEvent<HTMLInputElement>) => {
			setExerciseData((prev) => ({
				...prev,
				name: input.target.value,
				exercise: {
					...prev,
					exerciseId: undefined,
					newExerciseName: input.target.value,
				},
			}));
		};

		const handleAddSet = () => {
			setExerciseData((prev) => ({
				...prev,
				sets: [...prev.sets, { id: crypto.randomUUID(), weight: "", reps: "" }],
			}));
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
					value={exerciseData.name}
					onChange={handleNameUpdate}
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

				{exerciseNameBlurred && exerciseData.name.trim() && (
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
								{exerciseData.sets.map((set, index) => (
									<SetRow
										key={set.id}
										index={index}
										set={set}
										setExerciseData={setExerciseData}
									/>
								))}
							</div>
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
						<ExerciseCollapsibles
							exerciseData={exerciseData}
							setExerciseData={setExerciseData}
						/>
					</div>
				)}
			</section>
		);
	},
);

ExerciseForm.displayName = "ExerciseForm";

export default ExerciseForm;
