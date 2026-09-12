"use client";

import { IconChevronLeft } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { DEFAULT_EXERCISES } from "@/features/workout-form/lib/defaultExercises";
import {
	CATEGORY_LABELS,
	getCategoryForMuscleName,
	MUSCLE_GROUP_CATEGORIES,
	type MuscleGroupCategory,
} from "@/features/workout-form/lib/muscleGroupCategories";
import type { Workout } from "@/features/workout-form/lib/validateWorkout";

function getDefaultExercisesForCategory(category: MuscleGroupCategory) {
	return DEFAULT_EXERCISES.filter((exercise) =>
		exercise.muscleGroups.some((muscleName) => getCategoryForMuscleName(muscleName) === category),
	).toSorted((left, right) => left.name.localeCompare(right.name));
}

function ExerciseCategoryList({
	category,
	onSelect,
}: {
	category: MuscleGroupCategory;
	onSelect: (exercise: { name: string; muscleGroups: string[] }) => void;
}) {
	const exercises = useMemo(() => getDefaultExercisesForCategory(category), [category]);

	if (exercises.length === 0) {
		return <p className="px-2 text-muted-foreground text-sm">No exercises in this category.</p>;
	}

	return (
		<ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain">
			{exercises.map((exercise) => (
				<li key={exercise.id}>
					<Button
						type="button"
						variant="outline"
						className="min-h-11 w-full justify-start px-2 text-base font-normal"
						onClick={() =>
							onSelect({
								name: exercise.name,
								muscleGroups: exercise.muscleGroups,
							})
						}>
						{exercise.name}
					</Button>
				</li>
			))}
		</ul>
	);
}

export function MuscleGroupExercisePicker({ exerciseIndex }: { exerciseIndex: number }) {
	const { setValue, setFocus } = useFormContext<Workout>();
	const [selectedCategory, setSelectedCategory] = useState<MuscleGroupCategory | null>(null);

	const handleSelectExercise = (exercise: { name: string; muscleGroups: string[] }) => {
		setValue(`exercises.${exerciseIndex}.global.name`, exercise.name);
		setValue(`exercises.${exerciseIndex}.exerciseId`, undefined);
		setValue(`exercises.${exerciseIndex}.global.muscleGroups`, exercise.muscleGroups);
		setSelectedCategory(null);

		setTimeout(() => setFocus(`exercises.${exerciseIndex}.sets.0.weight`), 0);
	};

	if (selectedCategory === null) {
		return (
			<div className="flex min-h-0 flex-1 flex-col justify-start">
				<div className="grid grid-cols-2 gap-2">
					{MUSCLE_GROUP_CATEGORIES.map((category) => (
						<Button
							key={category}
							type="button"
							variant="outline"
							className="aspect-square h-auto w-full text-xl font-semibold"
							onClick={() => setSelectedCategory(category)}>
							{CATEGORY_LABELS[category]}
						</Button>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-2">
			<button
				type="button"
				className="hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground grid min-h-11 w-full shrink-0 grid-cols-[auto_1fr] items-center gap-x-1 rounded-sm px-0 py-2 text-left outline-hidden"
				onClick={() => setSelectedCategory(null)}
				aria-label="Back to categories">
				<IconChevronLeft className="size-5 shrink-0 -translate-x-1" />
				<span className="font-bold text-base">{CATEGORY_LABELS[selectedCategory]}</span>
			</button>
			<ExerciseCategoryList
				category={selectedCategory}
				onSelect={handleSelectExercise}
			/>
		</div>
	);
}
