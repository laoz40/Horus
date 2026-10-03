"use client";

import { useRouter } from "next/navigation";
import { type ReactElement } from "react";

import ErrorBoundary from "@/components/ErrorBoundary";
import {
	MuscleGroupExerciseBrowser,
	type PickedExercise,
} from "@/features/workout-form/components/MuscleGroupExerciseBrowser";

function ProgressExerciseBrowse() {
	const router = useRouter();

	const handleSelectExercise = (exercise: PickedExercise) => {
		router.push(`/progress/exercise/${encodeURIComponent(exercise.name)}`);
	};

	return (
		<section className="flex min-h-0 flex-1 flex-col px-4 pb-4">
			<h2 className="mb-1 text-muted-foreground">Exercises</h2>
			<div className="flex min-h-72 flex-1 flex-col">
				<MuscleGroupExerciseBrowser onSelectExercise={handleSelectExercise} />
			</div>
		</section>
	);
}

export default function ProgressExerciseBrowseSection(): ReactElement {
	return (
		<ErrorBoundary>
			<ProgressExerciseBrowse />
		</ErrorBoundary>
	);
}
