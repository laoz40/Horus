"use client";

import { useState } from "react";

import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import ExerciseListContent, {
	type ExerciseListItem,
} from "@/features/exercise-library/components/ExerciseListContent";
import { normalizeName } from "@/lib/normalizeName";
import { IconSearch } from "@tabler/icons-react";

interface ExerciseListProps {
	exercises: ExerciseListItem[];
	onSelectExercise: (exercise: ExerciseListItem) => void;
}

function filterExercises(exercises: ExerciseListItem[], query: string): ExerciseListItem[] {
	const normalizedQuery = normalizeName(query);

	if (normalizedQuery === "") {
		return exercises;
	}

	return exercises.filter((exercise) => normalizeName(exercise.name).includes(normalizedQuery));
}

export default function ExerciseList({ exercises, onSelectExercise }: ExerciseListProps) {
	const [searchQuery, setSearchQuery] = useState("");

	const filteredExercises = filterExercises(exercises, searchQuery);

	return (
		<div className="flex flex-col gap-3">
			<InputGroup className="h-11 border-border/70 bg-card shadow-none transition-colors focus-within:border-primary/60 dark:bg-card">
				<InputGroupInput
					placeholder="Search exercises..."
					value={searchQuery}
					onChange={(event) => setSearchQuery(event.target.value)}
					className="text-sm placeholder:text-muted-foreground/80"
				/>
				<InputGroupAddon className="text-muted-foreground/80">
					<IconSearch className="size-4" />
				</InputGroupAddon>
			</InputGroup>

			<ExerciseListContent
				exercises={filteredExercises}
				searchQuery={searchQuery}
				onSelectExercise={onSelectExercise}
			/>
		</div>
	);
}
