import type { ReactElement } from "react";
import { IconNotes, IconTrophyFilled } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import type { Exercise } from "@/features/workout-form/lib/validateWorkout";
import { setPrLabels } from "@/features/workout-form/lib/setPr";
import DetailPopover from "@/features/workout-view/components/DetailPopover";
import DifficultyBadge from "@/features/workout-view/components/DifficultyBadge";
import { cn } from "@/lib/utils";

interface ExerciseViewSectionProps {
	exercise: Exercise;
}

export default function ExerciseViewSection({ exercise }: ExerciseViewSectionProps): ReactElement {
	const completedSets = exercise.sets.filter((set) => set.completed);
	const notes = exercise.notes?.trim() ?? "";

	return (
		<section className="flex flex-col gap-2 pb-3">
			<div className="flex items-center justify-between gap-2">
				<div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
					<h3 className="text-base leading-tight font-semibold">{exercise.global.name}</h3>
					<DifficultyBadge difficulty={exercise.difficulty} />
				</div>
				{notes.length > 0 ? (
					<DetailPopover
						trigger={
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								className="shrink-0 justify-end text-muted-foreground hover:bg-transparent!"
								aria-label="View exercise notes">
								<IconNotes className="size-4" />
							</Button>
						}>
						<p className="whitespace-pre-wrap">{notes}</p>
					</DetailPopover>
				) : null}
			</div>

			<div className="flex flex-col">
				<div className="grid grid-cols-[2rem_1fr_1fr_2rem] gap-2 pb-1 text-xs tracking-wide text-muted-foreground uppercase">
					<span>#</span>
					<span>Weight</span>
					<span>Reps</span>
					<span className="text-right">PR</span>
				</div>
				{completedSets.map((set, index) => {
					const prTypes = set.prTypes ?? [];
					const hasPr = prTypes.length > 0;

					return (
						<div
							key={set.id}
							className="grid grid-cols-[2rem_1fr_1fr_2rem] items-center gap-2 border-t py-1 text-sm tabular-nums">
							<span className="text-muted-foreground">{index + 1}</span>
							<span className={cn(hasPr && "font-semibold")}>{set.weight ?? 0}</span>
							<span className={cn(hasPr && "font-semibold")}>{set.reps ?? 0}</span>
							<div className="flex justify-end">
								{hasPr ? (
									<DetailPopover
										trigger={
											<Button
												type="button"
												variant="ghost"
												size="icon-sm"
												className="size-7 justify-end text-primary hover:bg-transparent!"
												aria-label="View personal records">
												<IconTrophyFilled className="size-4" />
											</Button>
										}>
										<ul className="flex flex-col gap-1">
											{prTypes.map((prType) => (
												<li key={prType}>{setPrLabels[prType]}</li>
											))}
										</ul>
									</DetailPopover>
								) : null}
							</div>
						</div>
					);
				})}
			</div>
		</section>
	);
}
