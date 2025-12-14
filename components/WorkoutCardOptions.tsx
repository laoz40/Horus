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

interface WorkoutCardOptionsProps {
	handleDelete: () => void;
	workoutId: string;
}

export default function WorkoutCardOptions({
	handleDelete,
	workoutId,
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
							<Link href={`/workouts/${workoutId}/edit`}>Edit</Link>
						</DropdownMenuItem>
						<DropdownMenuItem>Share</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							variant="destructive"
							onClick={handleDelete}>
							Delete
						</DropdownMenuItem>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		</>
	);
}
