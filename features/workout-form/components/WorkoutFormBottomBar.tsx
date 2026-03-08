import { PlusIcon } from "lucide-react";
import { type ReactElement } from "react";

import { Button } from "@/components/ui/button";

import ExerciseSelector from "./ExerciseSelector";

interface WorkoutFormBottomBarProps {
	show: boolean;
	exercises: { id: string }[];
	selectedExerciseId?: string;
	onSelectExercise: (value: string) => void;
	onAddExercise: () => void;
}

export default function WorkoutFormBottomBar({
	show,
	exercises,
	selectedExerciseId,
	onSelectExercise,
	onAddExercise,
}: WorkoutFormBottomBarProps): ReactElement | null {
	if (!show) return null;

	return (
		<div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen border-t bg-sidebar dark:bg-sidebar glass:backdrop-blur-xs">
			<div className="max-w-5xl mx-auto px-4 flex flex-row w-full gap-4 py-4">
				<div className="flex grow items-center justify-start">
					<ExerciseSelector
						exercises={exercises}
						selectedExerciseId={selectedExerciseId}
						onValueChange={onSelectExercise}
					/>
				</div>
				<Button
					variant="default"
					type="button"
					onClick={onAddExercise}>
					<PlusIcon />
				</Button>
			</div>
		</div>
	);
}
