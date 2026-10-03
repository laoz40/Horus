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
		<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
			<ProgressExerciseDetail exerciseName={exerciseName} />
		</div>
	);
}
