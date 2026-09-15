"use client";

import { type ReactNode, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { IconChevronLeft, IconPlus } from "@tabler/icons-react";
import Link from "next/link";

import PageLoadingSpinner from "@/components/PageLoadingSpinner";
import { Button } from "@/components/ui/button";
import ExerciseEditSheet, {
	type ExerciseCatalogItem,
	type ExerciseEditSheetState,
} from "@/features/settings/components/ExerciseEditSheet";
import ExerciseList from "@/features/settings/components/ExerciseList";
import { orpc } from "@/lib/orpc/client";

export default function ExercisesSettingsPage() {
	const [sheetState, setSheetState] = useState<ExerciseEditSheetState>({ kind: "closed" });
	const exercisesQuery = useQuery(orpc.exercises.list.queryOptions());

	function openCreateSheet() {
		setSheetState({ kind: "create" });
	}

	function openEditSheet(exercise: ExerciseCatalogItem) {
		setSheetState({ kind: "edit", exercise });
	}

	function closeSheet() {
		setSheetState({ kind: "closed" });
	}

	if (exercisesQuery.isPending) {
		return (
			<ExercisesPageShell onAddExercise={openCreateSheet}>
				<PageLoadingSpinner
					label="Loading exercises"
					className="min-h-40"
				/>
			</ExercisesPageShell>
		);
	}

	if (exercisesQuery.isError) {
		return (
			<ExercisesPageShell onAddExercise={openCreateSheet}>
				<p className="py-8 text-center text-sm text-destructive">Failed to load exercises.</p>
			</ExercisesPageShell>
		);
	}

	return (
		<>
			<ExercisesPageShell onAddExercise={openCreateSheet}>
				<ExerciseList
					exercises={exercisesQuery.data.exercises}
					onSelectExercise={openEditSheet}
				/>
			</ExercisesPageShell>
			<ExerciseEditSheet
				state={sheetState}
				onClose={closeSheet}
			/>
		</>
	);
}

function ExercisesPageShell({
	children,
	onAddExercise,
}: {
	children: ReactNode;
	onAddExercise: () => void;
}) {
	return (
		<div className="flex flex-col gap-4 p-4">
			<div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
				<Link
					href="/settings"
					aria-label="Back to settings">
					<IconChevronLeft className="size-7" />
				</Link>
				<h1 className="text-2xl font-semibold">Exercises</h1>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					aria-label="Add exercise"
					onClick={onAddExercise}>
					<IconPlus className="size-6" />
				</Button>
			</div>
			{children}
		</div>
	);
}
