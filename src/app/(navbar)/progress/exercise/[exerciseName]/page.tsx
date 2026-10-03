import type { ReactElement } from "react";

import ProgressExerciseDetail from "@/features/progress/components/ProgressExerciseDetail";

interface ProgressExerciseDetailPageProps {
	params: Promise<{ exerciseName: string }>;
}

export default async function ProgressExerciseDetailPage({
	params,
}: ProgressExerciseDetailPageProps): Promise<ReactElement> {
	const { exerciseName: encodedExerciseName } = await params;
	const exerciseName = decodeURIComponent(encodedExerciseName);

	return (
		<div className="flex h-full w-full flex-1 flex-col pt-4">
			<ProgressExerciseDetail exerciseName={exerciseName} />
		</div>
	);
}
