"use client";

import { isDefinedError } from "@orpc/client";
import { useQuery } from "@tanstack/react-query";
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
import { getRelativeTime } from "@/lib/date";
import { orpc } from "@/lib/orpc/client";
import { cn } from "@/lib/utils";

interface RecentSetsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	exerciseName: string;
}

type RecentSetPrType = "weight" | "volume" | "bodyweightReps";

const prTypeLabels = {
	weight: "Weight PR",
	volume: "Volume PR",
	bodyweightReps: "Reps PR",
} satisfies Record<RecentSetPrType, string>;

function SetSkeletonRow() {
	return (
		<div className="grid grid-cols-[4rem_3rem_minmax(4rem,1fr)_8rem] gap-1 border-b py-2 last:border-b-0">
			<div className="bg-muted h-4 w-8 animate-pulse" />
			<div className="bg-muted h-4 w-8 animate-pulse" />
			<div />
			<div className="ml-auto bg-muted h-4 w-24 animate-pulse" />
		</div>
	);
}

export default function RecentSetsDialog({
	open,
	onOpenChange,
	exerciseName,
}: RecentSetsDialogProps) {
	const recentSetsQuery = useQuery(
		orpc.exercises.recentSets.queryOptions({
			input: { exerciseName },
			enabled: open && exerciseName.length > 0,
		}),
	);

	const getErrorMessage = () => {
		if (!recentSetsQuery.isError) return null;

		const error = recentSetsQuery.error;
		if (!isDefinedError(error)) return "Couldn't load recent sets.";

		switch (error.code) {
			case "DATABASE_ERROR":
			case "UNAUTHORIZED":
				return "Couldn't load recent sets.";
			default: {
				const exhaustiveError: never = error;
				return exhaustiveError;
			}
		}
	};

	const sets = (recentSetsQuery.data ?? []).map(({ completedAtMs, ...set }) => ({
		...set,
		time: getRelativeTime(new Date(completedAtMs)),
	}));
	const errorMessage = getErrorMessage();

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
						Your recently completed sets for&nbsp;
						<span className="font-bold">{exerciseName}</span>
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-3">
					<div className="grid grid-cols-[4rem_3rem_minmax(4rem,1fr)_8rem] gap-1 text-muted-foreground text-xs uppercase tracking-wide">
						<span>Weight</span>
						<span>Reps</span>
						<span />
						<span className="truncate text-right">Completed</span>
					</div>

					{recentSetsQuery.isFetching ? (
						<div className="flex flex-col">
							<SetSkeletonRow />
							<SetSkeletonRow />
							<SetSkeletonRow />
							<SetSkeletonRow />
							<SetSkeletonRow />
							<SetSkeletonRow />
						</div>
					) : errorMessage ? (
						<p className="text-destructive text-sm">{errorMessage}</p>
					) : sets.length === 0 ? (
						<p className="text-muted-foreground text-sm">No recent completed sets found.</p>
					) : (
						<div className="flex flex-col">
							{sets.map((set) => {
								const primaryPrType = set.prTypes[0];

								return (
									<div
										key={set.id}
										className="grid grid-cols-[4rem_3rem_minmax(4rem,1fr)_8rem] items-center gap-1 border-b py-2 text-sm last:border-b-0">
										<span className={cn(set.isPr && "font-semibold")}>{set.weight}</span>
										<span className={cn(set.isPr && "font-semibold")}>{set.reps}</span>
										<span>
											{primaryPrType ? (
												<span className="rounded-md border bg-muted px-1.5 py-0.5 text-muted-foreground text-xs whitespace-nowrap">
													{prTypeLabels[primaryPrType]}
												</span>
											) : null}
										</span>
										<span
											className={cn("min-w-0 truncate text-right", set.isPr && "font-semibold")}
											title={set.time}>
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
