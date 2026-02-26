import { type ReactElement } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { EllipsisVertical } from "lucide-react";
import { AlertDialogDestructive } from "@/components/DeleteWorkoutDialog";
import { WorkoutDbData } from "@/features/workout-history/lib/types";
import { Button } from "@/components/ui/button";

interface WorkoutCardOptionsProps {
	handleDelete: () => void;
	workout: WorkoutDbData;
}

export default function WorkoutCardOptions({
	handleDelete,
	workout,
}: WorkoutCardOptionsProps): ReactElement {
	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon-sm"
					className="mt-0.5 border border-transparent text-muted-foreground transition-colors hover:border-border/70 hover:text-foreground"
					aria-label="Workout options">
					<EllipsisVertical className="size-5" />
				</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align="end"
					className="w-34">
					<DropdownMenuGroup>
						<DropdownMenuItem asChild>
							<Link href={`/workouts/${workout.id}/edit`}>Edit</Link>
						</DropdownMenuItem>

						<DropdownMenuItem>Share</DropdownMenuItem>

						<DropdownMenuSeparator />

						<AlertDialogDestructive
							title="Delete workout?"
							description={`This will permanently delete workout: ${workout?.name}`}
							handleDelete={handleDelete}>
							<DropdownMenuItem
								variant="destructive"
								onSelect={(e) => e.preventDefault()}>
								Delete
							</DropdownMenuItem>
						</AlertDialogDestructive>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		</>
	);
}
