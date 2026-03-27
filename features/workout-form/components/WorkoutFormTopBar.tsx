"use client";

import Link from "next/link";
import { type ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { useWorkoutTimer } from "@/features/workout-form/hooks/useWorkoutTimer";
import { useWorkoutFormUiStore } from "@/features/workout-form/stores/workoutFormUiStore";
import { formatDurationFull } from "@/lib/time";

import { WorkoutNameDialog } from "./WorkoutNameDialog";

interface WorkoutFormTopBarProps {
	initialDurationSeconds: number;
	workoutId?: string;
	isSubmitting: boolean;
}

interface WorkoutDurationProps {
	initialDurationSeconds: number;
}

function WorkoutDuration({ initialDurationSeconds }: WorkoutDurationProps): ReactElement {
	const startedAtMs = useWorkoutFormUiStore((state) => state.startedAtMs);
	const { durationSeconds } = useWorkoutTimer({ initialDurationSeconds, startedAtMs });

	return <span>{formatDurationFull(durationSeconds)}</span>;
}

export default function WorkoutFormTopBar({
	initialDurationSeconds,
	workoutId,
	isSubmitting,
}: WorkoutFormTopBarProps): ReactElement {

	return (
		<div className="ios-safe-area-top relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-sidebar dark:bg-sidebar glass:backdrop-blur-xs border-b">
			<div className="max-w-5xl mx-auto px-4 flex flex-row justify-between items-center py-4">
				<Button
					variant="secondary"
					asChild
					size="sm">
					<Link href={workoutId ? "/workouts" : "/"}>Back</Link>
				</Button>
				<WorkoutDuration initialDurationSeconds={initialDurationSeconds} />
				<WorkoutNameDialog>
					<Button
						disabled={isSubmitting}
						size="sm">
						{isSubmitting ? "Saving" : "Finish"}
					</Button>
				</WorkoutNameDialog>
			</div>
		</div>
	);
}
