"use client";

import ExerciseMutationLabel from "@/features/exercise-library/components/ExerciseMutationLabel";
import { useState } from "react";
import { MAX_EXERCISE_NAME_LENGTH } from "@/features/workout-form/lib/validateWorkout";

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
import ExerciseMergeDialog from "@/features/exercise-library/components/ExerciseMergeDialog";
import MuscleGroupMultiSelect from "@/features/exercise-library/components/MuscleGroupMultiSelect";
import {
	getExerciseEditInitialCategories,
	getExerciseEditInitialName,
	getExerciseEditorTitle,
	type ExerciseEditorState,
	type OpenExerciseEditorState,
} from "@/features/exercise-library/lib/exerciseEditor";
import { formatWorkoutCount } from "@/features/exercise-library/lib/formatExerciseCatalog";
import { useExerciseEditMutations } from "@/features/exercise-library/hooks/useExerciseEditMutations";

interface ExerciseEditorProps {
	editor: ExerciseEditorState;
	onClose: () => void;
}

interface ExerciseEditFormProps {
	editor: OpenExerciseEditorState;
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
				<ExerciseMutationLabel
					isPending={isDeleting}
					label="Delete"
					pendingLabel="Deleting"
				/>
			</Button>
		</AlertDialogDestructive>
	);
}

function ExerciseEditForm({ editor, onClose }: ExerciseEditFormProps) {
	const [name, setName] = useState(() => getExerciseEditInitialName(editor));
	const [categories, setCategories] = useState(() => getExerciseEditInitialCategories(editor));
	const workoutCount = editor.state === "edit" ? editor.exercise.workoutCount : 0;

	const {
		state: operation,
		saveExercise,
		combineExercises,
		deleteCurrentExercise,
		cancelMerge,
	} = useExerciseEditMutations({
		editor,
		onClose,
	});

	const isSaving = operation.state === "saving";
	const isCombining = operation.state === "combining";
	const isDeleting = operation.state === "deleting";
	const trimmedName = name.trim();
	const canSave = trimmedName.length > 0 && operation.state === "editing";
	const mergeSourceName = editor.state === "edit" ? editor.exercise.name : trimmedName;
	const mergeSourceWorkoutCount = editor.state === "edit" ? editor.exercise.workoutCount : 0;

	return (
		<>
			<DialogHeader>
				<DialogTitle>{getExerciseEditorTitle(editor)}</DialogTitle>
			</DialogHeader>

			<div className="flex flex-col gap-5">
				<Field>
					<FieldLabel htmlFor="exercise-name">Name</FieldLabel>
					<FieldContent>
						<Input
							id="exercise-name"
							maxLength={MAX_EXERCISE_NAME_LENGTH}
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
					{categories.length === 0 && (
						<p className="text-sm text-muted-foreground">Won&apos;t appear in category browse.</p>
					)}
				</div>

				{editor.state === "edit" && (
					<p className="text-sm text-muted-foreground">
						Used in {formatWorkoutCount(workoutCount)}
					</p>
				)}
			</div>

			<DialogFooter className="flex-row justify-end">
				{editor.state === "edit" && (
					<ExerciseEditDeleteButton
						exerciseName={editor.exercise.name}
						workoutCount={workoutCount}
						isSaving={isSaving}
						isDeleting={isDeleting}
						isCombining={isCombining}
						onDelete={deleteCurrentExercise}
					/>
				)}

				<Button
					type="button"
					onClick={() => saveExercise(trimmedName, categories)}
					disabled={!canSave}>
					<ExerciseMutationLabel
						isPending={isSaving}
						label="Save"
						pendingLabel="Saving"
					/>
				</Button>
			</DialogFooter>

			{(operation.state === "confirmingMerge" || operation.state === "combining") && (
				<ExerciseMergeDialog
					open
					onOpenChange={(open) => {
						if (!open) {
							cancelMerge();
						}
					}}
					sourceName={mergeSourceName}
					targetName={operation.existingExercise.name}
					sourceWorkoutCount={mergeSourceWorkoutCount}
					kind={editor.state}
					onCombine={() => combineExercises(categories)}
					isCombining={isCombining}
				/>
			)}
		</>
	);
}

export default function ExerciseEditor({ editor, onClose }: ExerciseEditorProps) {
	const isOpen = editor.state !== "closed";
	const formKey = editor.state === "edit" ? editor.exercise.id : editor.state;

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
				{editor.state !== "closed" && (
					<ExerciseEditForm
						key={formKey}
						editor={editor}
						onClose={onClose}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}

export type {
	ExerciseCatalogItem,
	ExerciseEditorState,
} from "@/features/exercise-library/lib/exerciseEditor";
