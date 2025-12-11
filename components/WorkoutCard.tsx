import { type ReactElement } from "react";
import Card from "./Card";
import { getRelativeTime } from "@/lib/date";
import { Workout } from "@prisma/client";
import PrIndicator from "./PrIndicator";
import { ShineBorder } from "./ui/shine-border";
import WorkoutCardStats from "./WorkoutCardStats";
import Link from "next/link";

// TODO: calculate pr
const pr = "2";

// TODO: make the shine border conditional, and hide grey border if shine border
export default function WorkoutCard(workout: Workout): ReactElement {
	return (
		<>
			<Card>
				<ShineBorder
					shineColor="#34e1c9"
					duration={8}
				/>
				<div className="grid grid-cols-[1fr_min-content]">
					<h2 className="text-base font-bold">{workout.name}</h2>
					<span className="w-fit whitespace-nowrap text-muted-foreground font-light">
						{getRelativeTime(workout.createdAt)}
					</span>
				</div>

				<div className="grid grid-cols-[1fr_min-content] mt-1">
					<div className="flex flex-row justify-start gap-4">
						<span>chest</span>
						<span>back</span>
						<span>shoulders</span>
						<Link href={`/workouts/${workout.id}/edit`}>
							<button>Edit</button>
						</Link>
					</div>
					<PrIndicator pr={pr} />
				</div>

				<WorkoutCardStats />
			</Card>
		</>
	);
}
