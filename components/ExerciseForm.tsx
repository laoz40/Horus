"use client";
import { ChangeEvent, forwardRef } from "react";
import ExerciseCollapsibles from "./ExerciseCollapsibles";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { History } from "lucide-react";
import SetRow from "./SetRow";
import { cn } from "@/lib/utils";
import { ExerciseFormData } from "@/lib/types";

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

		// TODO: form validation

		return (
			<section
				ref={ref}
				className={cn("h-full flex flex-col gap-4 p-4", className)}>
				{/* Exercise Name */}
				<div className="flex flex-row gap-2">
					<Input
						placeholder="Add an exercise"
						value={exerciseData.name}
						onChange={handleNameUpdate}
					/>
					<Button
						variant="secondary"
						size="icon">
						<History></History>
					</Button>
				</div>

				{/* Set Rows */}
				<div className="flex flex-col overflow-y-auto no-scrollbar grow gap-3">
					<div className="flex flex-col pl-3 gap-3">
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
						variant="secondary"
						className="w-full"
						type="button"
						onClick={handleAddSet}>
						+ Set
					</Button>
				</div>

				{/* Difficulty and Notes */}
				<ExerciseCollapsibles
					exerciseData={exerciseData}
					setExerciseData={setExerciseData}
				/>
			</section>
		);
	},
);

ExerciseForm.displayName = "ExerciseForm";

export default ExerciseForm;
