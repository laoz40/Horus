"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import type {
	RecentCompletedSet,
	RecentCompletedSetPrType,
} from "@/features/workout-form/stores/workoutFormUiStore";

interface RecentCompletedSetsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	exerciseName: string;
	isLoading: boolean;
	error: string | null;
	sets: RecentCompletedSet[];
}

const prTypeLabels: Record<RecentCompletedSetPrType, string> = {
	weight: "Weight PR",
	volume: "Volume PR",
	bodyweightReps: "Reps PR",
};

export default function RecentCompletedSetsDialog({
	open,
	onOpenChange,
	exerciseName,
	isLoading,
	error,
	sets,
}: RecentCompletedSetsDialogProps) {
	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}>
			<DialogContent
				showCloseButton={false}
				className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Most Recent Sets</DialogTitle>
					<DialogDescription className="text-balance leading-snug">
						Your recently completed sets for&nbsp;<span className="font-bold">{exerciseName}</span>
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-3">
					<div className="grid grid-cols-[64px_48px_minmax(72px,1fr)_minmax(112px,auto)] gap-2 text-muted-foreground text-xs uppercase tracking-wide">
						<span>Weight</span>
						<span>Reps</span>
						<span />
						<span className="text-right whitespace-nowrap">Completed</span>
					</div>

					{isLoading ? (
						<div className="flex flex-col">
							{Array.from({ length: 6 }).map((_, index) => (
								<div
									key={index}
									className="grid grid-cols-[64px_48px_minmax(72px,1fr)_minmax(112px,auto)] gap-2 border-b py-2 last:border-b-0">
									<div className="bg-muted h-4 w-8 animate-pulse" />
									<div className="bg-muted h-4 w-8 animate-pulse" />
									<div className="bg-muted h-4 w-14 animate-pulse" />
									<div className="ml-auto bg-muted h-4 w-24 animate-pulse" />
								</div>
							))}
						</div>
					) : error ? (
						<p className="text-destructive text-sm">{error}</p>
					) : sets.length === 0 ? (
						<p className="text-muted-foreground text-sm">
							No recent completed sets found.
						</p>
					) : (
						<div className="flex flex-col">
							{sets.map((set, index) => {
								const primaryPrType = set.prTypes[0];

								return (
									<div
										key={`${set.time}-${set.weight}-${set.reps}-${index}`}
										className="grid grid-cols-[64px_48px_minmax(72px,1fr)_minmax(112px,auto)] items-center gap-2 border-b py-2 text-sm last:border-b-0">
										<span className={cn(set.isPr && "font-semibold")}>{set.weight}</span>
										<span className={cn(set.isPr && "font-semibold")}>{set.reps}</span>
										<span>
											{primaryPrType ? (
												<span className="rounded-md border bg-muted px-1.5 py-0.5 text-muted-foreground text-xs whitespace-nowrap">
													{prTypeLabels[primaryPrType]}
												</span>
											) : null}
										</span>
										<span className={cn("text-right whitespace-nowrap", set.isPr && "font-semibold")}>
											{set.time}
										</span>
									</div>
								);
							})}
						</div>
					)}
				</div>

				<DialogFooter>
					<DialogClose asChild>
						<Button variant="secondary">Close</Button>
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
