import { type ReactElement } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import Link from "next/link";
import { EllipsisVertical } from "lucide-react";
import { AlertDialogDestructive } from "./DeleteWorkoutDialog";
import { Workout } from "@prisma/client";
import { WorkoutDbData } from "@/lib/types";

interface WorkoutCardOptionsProps {
	handleDelete: () => void;
	workoutId: string;
	workout: WorkoutDbData;
}

export default function WorkoutCardOptions({
	handleDelete,
	workoutId,
	workout,
}: WorkoutCardOptionsProps): ReactElement {
	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<EllipsisVertical className="pl-1 pr-0" />
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align="start"
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
