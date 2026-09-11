"use client";

import { IconEdit } from "@tabler/icons-react";
import Link from "next/link";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import type { WorkoutFormData } from "@/features/workout-form/lib/types";
import WorkoutExitLink from "@/features/workout-form/components/WorkoutExitLink";
import ExerciseViewSection from "@/features/workout-view/components/ExerciseViewSection";
import WorkoutViewSummary from "@/features/workout-view/components/WorkoutViewSummary";

interface WorkoutViewProps {
	workout: WorkoutFormData & { createdAt: number };
	workoutId: string;
}

export default function WorkoutView({ workout, workoutId }: WorkoutViewProps): ReactElement {
	const exercisesWithCompletedSets = workout.exercises.filter((exercise) =>
		exercise.sets.some((set) => set.completed),
	);

	return (
		<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
			<div className="ios-safe-area-top relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen border-b bg-sidebar dark:bg-sidebar glass:backdrop-blur-xs">
				<div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2">
					<Button
						variant="outline"
						asChild
						size="icon">
						<WorkoutExitLink href="/workouts" />
					</Button>
					<Button
						variant="ghost"
						asChild
						size="icon">
						<Link
							href={`/workouts/${workoutId}/edit`}
							aria-label="Edit">
							<IconEdit className="size-7" />
						</Link>
					</Button>
				</div>
			</div>

			<div className="flex min-h-0 flex-1 flex-col overflow-y-auto no-scrollbar">
				<WorkoutViewSummary workout={workout} />
				<div className="flex flex-col gap-2 px-4 pb-4 pt-1">
					{exercisesWithCompletedSets.map((exercise) => (
						<ExerciseViewSection
							key={exercise.id}
							exercise={exercise}
						/>
					))}
				</div>
			</div>
		</div>
	);
}
