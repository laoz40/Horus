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
		<div className="ios-safe-area-top relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-sidebar dark:bg-sidebar glass:backdrop-blur-xs border-b">
			<div className="max-w-5xl mx-auto px-4 flex flex-row justify-between items-center py-2">
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
