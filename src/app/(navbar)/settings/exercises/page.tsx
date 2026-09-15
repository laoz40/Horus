"use client";

import { type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { IconChevronLeft } from "@tabler/icons-react";
import Link from "next/link";

import PageLoadingSpinner from "@/components/PageLoadingSpinner";
import ExerciseList from "@/features/settings/components/ExerciseList";
import { orpc } from "@/lib/orpc/client";

export default function ExercisesSettingsPage() {
	const exercisesQuery = useQuery(orpc.exercises.list.queryOptions());

	if (exercisesQuery.isPending) {
		return (
			<ExercisesPageShell>
				<PageLoadingSpinner
					label="Loading exercises"
					className="min-h-40"
				/>
			</ExercisesPageShell>
		);
	}

	if (exercisesQuery.isError) {
		return (
			<ExercisesPageShell>
				<p className="py-8 text-center text-sm text-destructive">Failed to load exercises.</p>
			</ExercisesPageShell>
		);
	}

	return (
		<ExercisesPageShell>
			<ExerciseList exercises={exercisesQuery.data.exercises} />
		</ExercisesPageShell>
	);
}

function ExercisesPageShell({ children }: { children: ReactNode }) {
	return (
		<div className="flex flex-col gap-4 p-4">
			<div className="grid grid-cols-[auto_1fr] items-center gap-2">
				<Link
					href="/settings"
					aria-label="Back to settings">
					<IconChevronLeft className="size-7" />
				</Link>
				<h1 className="text-2xl font-semibold">Exercises</h1>
			</div>
			{children}
		</div>
	);
}
