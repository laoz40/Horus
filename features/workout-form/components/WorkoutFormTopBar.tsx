import Link from "next/link";
import { type ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { formatDurationFull } from "@/lib/time";

import { WorkoutNameDialog } from "./WorkoutNameDialog";

interface WorkoutFormTopBarProps {
	workoutId?: string;
	durationSeconds: number;
	isSubmitting: boolean;
}

export default function WorkoutFormTopBar({
	workoutId,
	durationSeconds,
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
				<span>{formatDurationFull(durationSeconds)}</span>
				<WorkoutNameDialog>
					<Button
						disabled={isSubmitting}
						size="sm">
						{isSubmitting ? "Saving" : "Done"}
					</Button>
				</WorkoutNameDialog>
			</div>
		</div>
	);
}
