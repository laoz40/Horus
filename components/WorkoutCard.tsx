import { type ReactElement } from "react";
import Card from "./Card";
import { getRelativeTime } from "@/lib/date";
import { Workout } from "@prisma/client";

export default function WorkoutCard(workout: Workout): ReactElement {
	return (
			<Card>
				<div className="grid grid-cols-[1fr_min-content]">
					<h2 className="text-base font-bold">{workout.name}</h2>
					<span className="w-fit whitespace-nowrap text-muted-foreground font-light">
						{getRelativeTime(workout.createdAt)}
					</span>
				</div>

				<div className="grid grid-cols-[1fr_min-content]">
					<div className="flex flex-row justify-start gap-4">
						<span>chest</span>
						<span>back</span>
						<span>shoulders</span>
					</div>
					<span className="w-fit whitespace-nowrap">2 PRs</span>
				</div>

				<div className="grid grid-cols-3 mt-4">
					<span>stat</span>
					<span>stat</span>
					<span>stat</span>
				</div>
			</Card>
	);
}
