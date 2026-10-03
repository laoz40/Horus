"use client";

import { IconChevronLeft, IconLoader2 } from "@tabler/icons-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useExercisesByCategory } from "@/features/workout-form/hooks/useExercisesByCategory";
import {
	CATEGORY_LABELS,
	MUSCLE_GROUP_CATEGORIES,
	type MuscleGroupCategory,
} from "@/features/workout-form/lib/muscleGroupCategories";

export type PickedExercise = {
	name: string;
	muscleGroups?: string[];
};

type CategoryExercise = PickedExercise & {
	normalizedName: string;
};

function ExerciseCategoryList({
	exercises,
	isLoading,
	onSelect,
}: {
	exercises: CategoryExercise[];
	isLoading: boolean;
	onSelect: (exercise: PickedExercise) => void;
}) {
	const isInitialLoad = isLoading && exercises.length === 0;

	if (isInitialLoad) {
		return (
			<div className="flex items-center gap-2 px-2 text-sm text-muted-foreground">
				<IconLoader2
					className="size-4 animate-spin"
					aria-label="Loading exercises"
				/>
				Loading
			</div>
		);
	}

	if (exercises.length === 0) {
		return <p className="px-2 text-sm text-muted-foreground">No exercises in this category.</p>;
	}

	return (
		<ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain">
			{exercises.map((exercise) => (
				<li key={exercise.normalizedName}>
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

function ExerciseCategoryView({
	category,
	onBack,
	onSelect,
}: {
	category: MuscleGroupCategory;
	onBack: () => void;
	onSelect: (exercise: PickedExercise) => void;
}) {
	const { exercises, isLoading, isFetching } = useExercisesByCategory(category);

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-2">
			<Button
				type="button"
				variant="ghost"
				className="h-auto min-h-9 w-full shrink-0 justify-start gap-0.5 px-0 py-1 text-left text-base font-bold has-[>svg]:px-0"
				onClick={onBack}
				aria-label="Back to categories">
				<IconChevronLeft className="-ms-1.5 size-5 shrink-0" />
				{CATEGORY_LABELS[category]}
				{isFetching ? (
					<span className="flex items-center gap-1 text-sm font-normal text-muted-foreground">
						<IconLoader2
							className="size-4 animate-spin"
							aria-hidden
						/>
						Loading
					</span>
				) : null}
			</Button>
			<ExerciseCategoryList
				exercises={exercises}
				isLoading={isLoading}
				onSelect={onSelect}
			/>
		</div>
	);
}

export function MuscleGroupExerciseBrowser({
	onSelectExercise,
}: {
	onSelectExercise: (exercise: PickedExercise) => void;
}) {
	const [selectedCategory, setSelectedCategory] = useState<MuscleGroupCategory | null>(null);

	if (selectedCategory === null) {
		return (
			<div className="flex min-h-0 flex-1 flex-col">
				<div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-4 gap-2">
					{MUSCLE_GROUP_CATEGORIES.map((category) => (
						<Button
							key={category}
							type="button"
							variant="outline"
							className="h-full min-h-11 w-full text-xl font-semibold"
							onClick={() => setSelectedCategory(category)}>
							{CATEGORY_LABELS[category]}
						</Button>
					))}
				</div>
			</div>
		);
	}

	return (
		<ExerciseCategoryView
			category={selectedCategory}
			onBack={() => setSelectedCategory(null)}
			onSelect={onSelectExercise}
		/>
	);
}
