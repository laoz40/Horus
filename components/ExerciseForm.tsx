"use client";
import { ChangeEvent, type ReactElement } from "react";
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
		id: string;
	}[];
	difficulty?: number;
	notes?: string;
	id: string;
}

export interface ExerciseFormProps {
	exerciseData: Exercise;
	setExerciseData: (updaterFn: (prev: Exercise) => Exercise) => void;
}

export default function ExerciseForm({
	exerciseData,
	setExerciseData,
}: ExerciseFormProps): ReactElement {
	const handleNameUpdate = (input: ChangeEvent<HTMLInputElement>) => {
		setExerciseData((prev) => ({ ...prev, name: input.target.value }));
	};

	const handleAddSet = () => {
		setExerciseData((prev) => ({
			...prev,
			sets: [...prev.sets, { id: crypto.randomUUID(), weight: "", reps: "" }],
		}));
	};

// TODO: form validation

	return (
		<>
			<div className="flex flex-col grow gap-4 p-4">
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
				<div className="flex flex-col grow gap-3">
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
				<ExerciseCollapsibles />
			</div>
		</>
	);
}
