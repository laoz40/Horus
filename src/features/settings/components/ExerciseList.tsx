"use client";

import { useMemo, useState } from "react";

import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
	formatMuscleGroups,
	formatWorkoutCount,
} from "@/features/settings/lib/formatExerciseCatalog";
import { normalizeName } from "@/lib/normalizeName";
import { IconSearch } from "@tabler/icons-react";

interface ExerciseListItem {
	id: string;
	name: string;
	muscleGroups: string[];
	workoutCount: number;
}

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

	const filteredExercises = useMemo(
		() => filterExercises(exercises, searchQuery),
		[exercises, searchQuery],
	);

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

			{filteredExercises.length === 0 ? (
				<p className="py-8 text-center text-sm text-muted-foreground">
					{searchQuery.trim() === "" ? "No exercises yet." : "No exercises match your search."}
				</p>
			) : (
				<ul className="flex flex-col gap-3">
					{filteredExercises.map((exercise) => (
						<li key={exercise.id}>
							<button
								type="button"
								aria-label={`Edit ${exercise.name}`}
								onClick={() => onSelectExercise(exercise)}
								className="w-full rounded-md border bg-card p-3 text-left transition-colors hover:bg-accent/40">
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0 flex-1">
										<p className="leading-tight font-medium">{exercise.name}</p>
										<p className="mt-1 text-sm text-muted-foreground">
											{formatMuscleGroups(exercise.muscleGroups)}
										</p>
									</div>
									<span className="shrink-0 text-sm text-muted-foreground tabular-nums">
										{formatWorkoutCount(exercise.workoutCount)}
									</span>
								</div>
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
