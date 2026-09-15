"use client";

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
import ExerciseMergeDialog from "@/features/settings/components/ExerciseMergeDialog";
import MuscleGroupMultiSelect from "@/features/settings/components/MuscleGroupMultiSelect";
import {
	getExerciseEditInitialCategories,
	getExerciseEditInitialName,
	getExerciseEditSheetTitle,
	type ExerciseEditSheetState,
	type OpenExerciseEditSheetState,
} from "@/features/settings/lib/exerciseEditSheet";
import { formatWorkoutCount } from "@/features/settings/lib/formatExerciseCatalog";
import {
	type NameCollisionState,
	useExerciseEditMutations,
} from "@/features/settings/hooks/useExerciseEditMutations";

interface ExerciseEditSheetProps {
	state: ExerciseEditSheetState;
	onClose: () => void;
}

interface ExerciseEditFormProps {
	state: OpenExerciseEditSheetState;
	onClose: () => void;
}

interface ExerciseEditDeleteButtonProps {
	exerciseName: string;
	workoutCount: number;
	isSaving: boolean;
	isDeleting: boolean;
	isCombining: boolean;
	onDelete: () => void;
}

function ExerciseEditDeleteButton({
	exerciseName,
	workoutCount,
	isSaving,
	isDeleting,
	isCombining,
	onDelete,
}: ExerciseEditDeleteButtonProps) {
	return (
		<AlertDialogDestructive
			title={`Delete ${exerciseName}?`}
			description="This exercise will be permanently removed."
			handleDelete={onDelete}>
			<Button
				type="button"
				variant="destructive"
				disabled={workoutCount > 0 || isSaving || isDeleting || isCombining}>
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
	);
}

function ExerciseEditForm({ state, onClose }: ExerciseEditFormProps) {
	const [name, setName] = useState(() => getExerciseEditInitialName(state));
	const [categories, setCategories] = useState(() => getExerciseEditInitialCategories(state));
	const [nameCollision, setNameCollision] = useState<NameCollisionState | null>(null);
	const workoutCount = state.kind === "edit" ? state.exercise.workoutCount : 0;

	const {
		saveExercise,
		combineExercises,
		deleteCurrentExercise,
		isSaving,
		isCombining,
		isDeleting,
	} = useExerciseEditMutations({
		state,
		onClose,
		onNameCollision: setNameCollision,
		onClearNameCollision: () => setNameCollision(null),
	});

	const trimmedName = name.trim();
	const canSave = trimmedName.length > 0 && !isSaving && !isDeleting && !isCombining;
	const mergeSourceName = state.kind === "edit" ? state.exercise.name : trimmedName;
	const mergeSourceWorkoutCount = state.kind === "edit" ? state.exercise.workoutCount : 0;

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
					<ExerciseEditDeleteButton
						exerciseName={state.exercise.name}
						workoutCount={workoutCount}
						isSaving={isSaving}
						isDeleting={isDeleting}
						isCombining={isCombining}
						onDelete={deleteCurrentExercise}
					/>
				) : null}

				<Button
					type="button"
					onClick={() => saveExercise(trimmedName, categories)}
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

			{nameCollision ? (
				<ExerciseMergeDialog
					open
					onOpenChange={(open) => {
						if (!open) {
							setNameCollision(null);
						}
					}}
					sourceName={mergeSourceName}
					targetName={nameCollision.existingExercise.name}
					sourceWorkoutCount={mergeSourceWorkoutCount}
					kind={state.kind}
					onCombine={() => combineExercises(nameCollision, categories)}
					isCombining={isCombining}
				/>
			) : null}
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
