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
import { EllipsisVertical } from "lucide-react";
import { AlertDialogDestructive } from "@/components/DeleteWorkoutDialog";
import { Button } from "@/components/ui/button";

interface WorkoutCardOptionsProps {
	workoutId: string;
	workoutName: string;
}

export default function WorkoutCardOptions({
	workoutId,
	workoutName,
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
						<DropdownMenuItem
							asChild
							className="h-10">
							<Link href={`/workouts/${workoutId}/edit`}>Edit</Link>
						</DropdownMenuItem>

						<DropdownMenuItem className="h-10">Share</DropdownMenuItem>

						<DropdownMenuSeparator />

						<AlertDialogDestructive
							title="Delete workout?"
							description={`This will permanently delete workout: ${workoutName}`}
							handleDelete={() => undefined}>
							<DropdownMenuItem
								className="h-10"
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
