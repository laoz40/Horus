"use client";

import { IconCheck, IconLoader2 } from "@tabler/icons-react";
import { type ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { useWorkoutTimer } from "@/features/workout-form/hooks/useWorkoutTimer";
import { useWorkoutFormUiStore } from "@/features/workout-form/stores/workoutFormUiStore";
import { formatDurationFull } from "@/lib/time";

import { WorkoutNameDialog } from "@/features/workout-form/components/WorkoutNameDialog";
import WorkoutExitLink from "@/features/workout-form/components/WorkoutExitLink";

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
		<div className="ios-safe-area-top relative right-1/2 left-1/2 -mr-[50vw] -ml-[50vw] w-screen border-b bg-sidebar dark:bg-sidebar">
			<div className="mx-auto flex max-w-5xl flex-row items-center justify-between px-4 py-2">
				<Button
					variant="outline"
					asChild
					size="icon">
					<WorkoutExitLink href={workoutId ? "/workouts" : "/"} />
				</Button>
				<WorkoutDuration initialDurationSeconds={initialDurationSeconds} />
				<WorkoutNameDialog>
					<Button
						variant="ghost"
						disabled={isSubmitting}
						size="icon"
						aria-label={isSubmitting ? "Saving" : "Finish"}>
						{isSubmitting ? (
							<IconLoader2 className="size-7 animate-spin text-primary" />
						) : (
							<IconCheck className="size-7 text-primary" />
						)}
					</Button>
				</WorkoutNameDialog>
			</div>
		</div>
	);
}
