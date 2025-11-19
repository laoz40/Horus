"use client";
import { Dispatch, SetStateAction, type ReactElement } from "react";
import ExerciseCollapsibles from "./ExerciseCollapsibles";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { History } from "lucide-react";
import SetRow from "./SetRow";

export interface Exercise {
	name: string;
	sets: {
		weight: string;
		reps: string;
	}[];
	//	difficulty: number;
	//	notes: string;
}

export interface ExerciseFormProps {
	exerciseData: Exercise;
	setExerciseData: Dispatch<SetStateAction<Exercise>>;
}

export default function ExerciseForm({
	exerciseData: exerciseData,
	setExerciseData: setExerciseData,
}: ExerciseFormProps): ReactElement {
	return (
		<>
			<div className="flex flex-col gap-4 p-4">
				{/* Exercise Name */}
				<div className="flex flex-row gap-2">
					<Input
						placeholder="Add an exercise"
						value={exerciseData.name}
						onChange={(input) =>
							setExerciseData((prev) => ({ ...prev, name: input.target.value }))
						}
					/>
					<Button
						variant="secondary"
						size="icon">
						<History></History>
					</Button>
				</div>

				{/* Set Rows */}
				<div className="flex flex-col grow gap-3">
					<div className="flex flex-col pl-3 gap-3">
						{exerciseData.sets.map((set, index) => (
							<SetRow
								key={index}
								index={index}
								set={set}
								exerciseData={exerciseData}
								setExerciseData={setExerciseData}
							/>
						))}
					</div>
					{/* TODO: Make this button add a new setrow element */}
					{/* TODO: Refactor stuff */}
					<Button
						variant="secondary"
						className="w-full">
						+ Set
					</Button>
				</div>

				{/* Difficulty and Notes */}
				<ExerciseCollapsibles />
			</div>
		</>
	);
}
