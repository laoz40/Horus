"use client";

import { type ReactElement } from "react";
import Link from "next/link";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconDotsVertical, IconEdit, IconShare, IconTrash } from "@tabler/icons-react";
import { AlertDialogDestructive } from "@/components/DeleteWorkoutDialog";
import { Button } from "@/components/ui/button";
import { useWorkoutDeletion } from "@/features/workout-history/hooks/useWorkoutDeletion";

interface WorkoutCardOptionsProps {
	workoutId: string;
	workoutName: string;
}

export default function WorkoutCardOptions({
	workoutId,
	workoutName,
}: WorkoutCardOptionsProps): ReactElement {
	const { state, send } = useWorkoutDeletion(workoutId);

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="icon-sm"
						className="mt-0.5 items-start justify-end border border-transparent text-muted-foreground transition-colors hover:border-border/70 hover:bg-transparent hover:text-foreground active:bg-transparent data-[state=open]:bg-transparent"
						aria-label="Workout options"
						onClick={(event) => event.stopPropagation()}
						onPointerDown={(event) => event.stopPropagation()}>
						<IconDotsVertical className="size-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align="end"
					className="w-34">
					<DropdownMenuGroup>
						<DropdownMenuItem
							asChild
							className="h-10 gap-1">
							<Link href={`/workouts/${workoutId}/edit`}>
								<IconEdit className="size-4" />
								Edit
							</Link>
						</DropdownMenuItem>

						<DropdownMenuItem className="h-10 gap-1">
							<IconShare className="size-4" />
							Share
						</DropdownMenuItem>

						<DropdownMenuSeparator />

						<AlertDialogDestructive
							title="Delete workout?"
							description={`This will permanently delete workout: ${workoutName}`}
							open={state.state === "confirming"}
							onOpenChange={(open) => send({ event: open ? "OPEN" : "CLOSE" })}
							handleDelete={() => send({ event: "CONFIRM" })}>
							<DropdownMenuItem
								className="h-10 gap-1"
								variant="destructive"
								disabled={state.state === "deleting"}
								onSelect={(e) => e.preventDefault()}>
								<IconTrash className="size-4" />
								Delete
							</DropdownMenuItem>
						</AlertDialogDestructive>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		</>
	);
}
