"use client";

import { IconChevronLeft } from "@tabler/icons-react";
import Link from "next/link";
import type { ReactElement } from "react";

import { BackNavButton, backNavIconClassName } from "@/components/BackNavButton";
import PersonalRecordsSection from "@/features/progress/components/PersonalRecordsSection";
import RecentSetsSection from "@/features/progress/components/RecentSetsSection";
import WeightProgressionSection from "@/features/progress/components/WeightProgressionSection";

interface ProgressExerciseDetailProps {
	exerciseName: string;
}

export default function ProgressExerciseDetail({
	exerciseName,
}: ProgressExerciseDetailProps): ReactElement {
	return (
		<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
			<div className="relative right-1/2 left-1/2 -mr-[50vw] -ml-[50vw] w-screen shrink-0 border-b bg-sidebar dark:bg-sidebar">
				<div className="mx-auto flex max-w-5xl items-center px-4 py-2">
					<div className="flex min-w-0 items-center gap-0.5">
						<BackNavButton asChild>
							<Link
								href="/progress"
								aria-label="Back to progress">
								<IconChevronLeft className={backNavIconClassName} />
							</Link>
						</BackNavButton>
						<h1 className="min-w-0 truncate text-lg font-semibold">{exerciseName}</h1>
					</div>
				</div>
			</div>

			<div className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-4 pb-6 max-md:pb-20">
				<WeightProgressionSection exerciseName={exerciseName} />
				<PersonalRecordsSection exerciseName={exerciseName} />
				<RecentSetsSection exerciseName={exerciseName} />
			</div>
		</div>
	);
}
