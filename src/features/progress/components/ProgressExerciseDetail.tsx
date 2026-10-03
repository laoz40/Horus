"use client";

import { IconChevronLeft } from "@tabler/icons-react";
import Link from "next/link";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import ProgressExercisePersonalRecordsSection from "@/features/progress/components/ProgressExercisePersonalRecordsSection";
import ProgressExerciseRecentSetsSection from "@/features/progress/components/ProgressExerciseRecentSetsSection";

interface ProgressExerciseDetailProps {
	exerciseName: string;
}

export default function ProgressExerciseDetail({
	exerciseName,
}: ProgressExerciseDetailProps): ReactElement {
	return (
		<div className="flex flex-col px-4 pb-4">
			<div className="mb-4 flex items-center gap-2">
				<Button
					variant="outline"
					size="icon"
					asChild>
					<Link
						href="/progress"
						aria-label="Back to progress">
						<IconChevronLeft className="size-7" />
					</Link>
				</Button>
				<h1 className="min-w-0 truncate text-lg font-semibold">{exerciseName}</h1>
			</div>

			<ProgressExercisePersonalRecordsSection exerciseName={exerciseName} />
			<ProgressExerciseRecentSetsSection exerciseName={exerciseName} />
		</div>
	);
}
