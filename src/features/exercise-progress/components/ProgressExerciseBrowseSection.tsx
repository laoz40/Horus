"use client";

import { useRouter } from "next/navigation";
import { type ReactElement } from "react";

import ErrorBoundary from "@/components/ErrorBoundary";
import {
	MuscleGroupExerciseBrowser,
	type PickedExercise,
} from "@/features/exercise-picker/components/MuscleGroupExerciseBrowser";

function ProgressExerciseBrowse() {
	const router = useRouter();

	const handleSelectExercise = (exercise: PickedExercise) => {
		router.push(`/progress/exercise/${encodeURIComponent(exercise.name)}`);
	};

	return (
		<section className="flex min-h-0 flex-1 flex-col px-4 pb-4">
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
