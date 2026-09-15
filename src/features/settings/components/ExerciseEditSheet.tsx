"use client";

import { isDefinedError } from "@orpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IconLoader2 } from "@tabler/icons-react";
import { useState } from "react";

import { AlertDialogDestructive } from "@/components/DeleteWorkoutDialog";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import MuscleGroupMultiSelect from "@/features/settings/components/MuscleGroupMultiSelect";
import { categoriesToMuscleGroups } from "@/features/settings/lib/exerciseCatalogMuscleGroups";
import {
	getExerciseEditInitialCategories,
	getExerciseEditInitialName,
	getExerciseEditSheetTitle,
	type ExerciseEditSheetState,
	type OpenExerciseEditSheetState,
} from "@/features/settings/lib/exerciseEditSheet";
import { formatWorkoutCount } from "@/features/settings/lib/formatExerciseCatalog";
import { invalidateExerciseQueries } from "@/features/settings/lib/invalidateExerciseQueries";
import { orpc } from "@/lib/orpc/client";
import { showErrorToast, showExerciseDeletedToast, showInfoToast } from "@/lib/toastMessages";

interface ExerciseEditSheetProps {
	state: ExerciseEditSheetState;
	onClose: () => void;
}

interface ExerciseEditFormProps {
	state: OpenExerciseEditSheetState;
	onClose: () => void;
}

function ExerciseEditForm({ state, onClose }: ExerciseEditFormProps) {
	const queryClient = useQueryClient();
	const [name, setName] = useState(() => getExerciseEditInitialName(state));
	const [categories, setCategories] = useState(() => getExerciseEditInitialCategories(state));
	const workoutCount = state.kind === "edit" ? state.exercise.workoutCount : 0;

	const createExercise = useMutation(
		orpc.exercises.create.mutationOptions({
			onSuccess: async () => {
				showInfoToast("Exercise added");
				await invalidateExerciseQueries(queryClient);
				onClose();
			},
			onError: (error) => {
				if (!isDefinedError(error)) {
					showErrorToast("Failed to add exercise.");
					console.error(error);

					return;
				}

				switch (error.code) {
					case "NAME_COLLISION":
						showErrorToast("An exercise with this name already exists.");

						return;
					case "EXERCISE_NOT_FOUND":
						showErrorToast("Couldn't find this exercise.");

						return;
					case "DATABASE_ERROR":
						showErrorToast("Couldn't access the database. Please try again.");

						return;
					case "UNAUTHORIZED":
						showErrorToast("You must be signed in to add exercises.");

						return;
					default: {
						const exhaustiveError: never = error;

						return exhaustiveError;
					}
				}
			},
		}),
	);

	const updateExercise = useMutation(
		orpc.exercises.update.mutationOptions({
			onSuccess: async () => {
				showInfoToast("Exercise saved");
				await invalidateExerciseQueries(queryClient);
				onClose();
			},
			onError: (error) => {
				if (!isDefinedError(error)) {
					showErrorToast("Failed to save exercise.");
					console.error(error);

					return;
				}

				switch (error.code) {
					case "NAME_COLLISION":
						showErrorToast("An exercise with this name already exists.");

						return;
					case "EXERCISE_NOT_FOUND":
						showErrorToast("Couldn't find this exercise.");

						return;
					case "DATABASE_ERROR":
						showErrorToast("Couldn't access the database. Please try again.");

						return;
					case "UNAUTHORIZED":
						showErrorToast("You must be signed in to edit exercises.");

						return;
					default: {
						const exhaustiveError: never = error;

						return exhaustiveError;
					}
				}
			},
		}),
	);

	const deleteExercise = useMutation(
		orpc.exercises.delete.mutationOptions({
			onSuccess: async () => {
				showExerciseDeletedToast();
				await invalidateExerciseQueries(queryClient);
				onClose();
			},
			onError: (error) => {
				if (!isDefinedError(error)) {
					showErrorToast("Failed to delete exercise.");
					console.error(error);

					return;
				}

				switch (error.code) {
					case "EXERCISE_NOT_FOUND":
						showErrorToast("Couldn't find this exercise.");

						return;
					case "EXERCISE_IN_USE":
						showErrorToast("This exercise is used in workouts and cannot be deleted.");

						return;
					case "DATABASE_ERROR":
						showErrorToast("Couldn't access the database. Please try again.");

						return;
					case "UNAUTHORIZED":
						showErrorToast("You must be signed in to delete exercises.");

						return;
					default: {
						const exhaustiveError: never = error;

						return exhaustiveError;
					}
				}
			},
		}),
	);

	const isSaving = createExercise.isPending || updateExercise.isPending;
	const isDeleting = deleteExercise.isPending;
	const trimmedName = name.trim();
	const canSave = trimmedName.length > 0 && !isSaving && !isDeleting;

	function handleSave() {
		if (!canSave) {
			return;
		}

		const muscleGroups = categoriesToMuscleGroups(categories);

		if (state.kind === "create") {
			createExercise.mutate({
				name: trimmedName,
				muscleGroups,
			});

			return;
		}

		updateExercise.mutate({
			id: state.exercise.id,
			name: trimmedName,
			muscleGroups,
		});
	}

	function handleDelete() {
		if (state.kind !== "edit") {
			return;
		}

		deleteExercise.mutate({ id: state.exercise.id });
	}

	return (
		<>
			<DialogHeader>
				<DialogTitle>{getExerciseEditSheetTitle(state)}</DialogTitle>
			</DialogHeader>

			<div className="flex flex-col gap-5">
				<Field>
					<FieldLabel htmlFor="exercise-name">Name</FieldLabel>
					<FieldContent>
						<Input
							id="exercise-name"
							value={name}
							onChange={(event) => setName(event.target.value)}
							autoComplete="off"
						/>
					</FieldContent>
				</Field>

				<div className="flex flex-col gap-2">
					<p className="text-sm font-medium">Categories</p>
					<MuscleGroupMultiSelect
						selectedCategories={categories}
						onChange={setCategories}
					/>
					{categories.length === 0 ? (
						<p className="text-sm text-muted-foreground">Won&apos;t appear in category browse.</p>
					) : null}
				</div>

				{state.kind === "edit" ? (
					<p className="text-sm text-muted-foreground">
						Used in {formatWorkoutCount(workoutCount)}
					</p>
				) : null}
			</div>

			<DialogFooter className="flex-row justify-end gap-2">
				{state.kind === "edit" ? (
					<AlertDialogDestructive
						title={`Delete ${state.exercise.name}?`}
						description="This exercise will be permanently removed."
						handleDelete={handleDelete}>
						<Button
							type="button"
							variant="destructive"
							disabled={workoutCount > 0 || isSaving || isDeleting}>
							{isDeleting ? (
								<>
									<IconLoader2
										className="size-4 animate-spin"
										aria-hidden
									/>
									Deleting
								</>
							) : (
								"Delete"
							)}
						</Button>
					</AlertDialogDestructive>
				) : null}

				<Button
					type="button"
					onClick={handleSave}
					disabled={!canSave}>
					{isSaving ? (
						<>
							<IconLoader2
								className="size-4 animate-spin"
								aria-hidden
							/>
							Saving
						</>
					) : (
						"Save"
					)}
				</Button>
			</DialogFooter>
		</>
	);
}

export default function ExerciseEditSheet({ state, onClose }: ExerciseEditSheetProps) {
	const isOpen = state.kind !== "closed";
	const formKey = state.kind === "edit" ? state.exercise.id : state.kind;

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) {
					onClose();
				}
			}}>
			<DialogContent
				aria-describedby={undefined}
				className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
				{state.kind !== "closed" ? (
					<ExerciseEditForm
						key={formKey}
						state={state}
						onClose={onClose}
					/>
				) : null}
			</DialogContent>
		</Dialog>
	);
}

export type {
	ExerciseCatalogItem,
	ExerciseEditSheetState,
} from "@/features/settings/lib/exerciseEditSheet";
