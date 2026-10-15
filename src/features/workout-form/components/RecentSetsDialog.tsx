"use client";

import { isDefinedError } from "@orpc/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import RecentSetRow from "@/features/progress/components/RecentSetRow";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { orpc } from "@/lib/orpc/client";

interface RecentSetsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	exerciseName: string;
}

function SetSkeletonRow() {
	return (
		<div className="exercise-set-grid-row">
			<div className="h-4 w-8 animate-pulse rounded-sm bg-muted" />
			<div className="h-4 w-8 animate-pulse rounded-sm bg-muted" />
			<div />
			<div className="ml-auto h-4 w-24 animate-pulse rounded-sm bg-muted" />
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
			// Recent sets only change after saving a workout, not mid-form.
			staleTime: Number.POSITIVE_INFINITY,
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

	const sets = recentSetsQuery.data ?? [];

	const errorMessage = getErrorMessage();

	const renderSets = () => {
		if (recentSetsQuery.isLoading) {
			return (
				<div className="flex flex-col">
					<SetSkeletonRow />
					<SetSkeletonRow />
					<SetSkeletonRow />
					<SetSkeletonRow />
					<SetSkeletonRow />
					<SetSkeletonRow />
				</div>
			);
		}

		if (errorMessage) {
			return <p className="text-sm text-destructive">{errorMessage}</p>;
		}

		if (sets.length === 0) {
			return <p className="text-sm text-muted-foreground">No recent completed sets found.</p>;
		}

		return (
			<div className="flex flex-col">
				{sets.map((set) => {
					return (
						<RecentSetRow
							key={set.id}
							set={set}
						/>
					);
				})}
			</div>
		);
	};

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}>
			<DialogContent
				showCloseButton={false}
				className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Most Recent Sets</DialogTitle>
					<DialogDescription className="leading-snug text-balance">
						Your recently completed sets for&nbsp;
						<span className="font-bold">{exerciseName}</span>
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-3">
					<div className="exercise-set-grid-header">
						<span>Weight</span>
						<span>Reps</span>
						<span />
						<span className="truncate text-right">Completed</span>
					</div>

					{renderSets()}
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
