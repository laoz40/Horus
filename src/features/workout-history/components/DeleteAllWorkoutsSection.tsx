"use client";

import { AlertDialogDestructive } from "@/components/DeleteWorkoutDialog";
import SectionCard from "@/components/SectionCard";
import { Button } from "@/components/ui/button";
import { useDeleteAllWorkouts } from "@/features/workout-history/hooks/useDeleteAllWorkouts";

export default function DeleteAllWorkoutsSection() {
	const { state, send } = useDeleteAllWorkouts();

	return (
		<SectionCard header="Data">
			<div className="flex flex-row items-center justify-between">
				<span>Workouts</span>
				<AlertDialogDestructive
					title="Delete all workouts?"
					description="This will permanently delete all workouts."
					open={state.state === "confirming"}
					onOpenChange={(open) => send({ event: open ? "OPEN" : "CLOSE" })}
					handleDelete={() => send({ event: "CONFIRM" })}>
					<Button
						variant="destructive"
						disabled={state.state === "deleting"}
						size="sm">
						Delete all workouts
					</Button>
				</AlertDialogDestructive>
			</div>
		</SectionCard>
	);
}
