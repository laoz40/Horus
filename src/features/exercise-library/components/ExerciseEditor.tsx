"use client";

import { useStore } from "zustand";

import ExerciseMutationLabel from "@/features/exercise-library/components/ExerciseMutationLabel";
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
	getExerciseEditorTitle,
	type ExerciseEditorState,
	type OpenExerciseEditorState,
} from "@/features/exercise-library/lib/exerciseEditor";
import { formatWorkoutCount } from "@/features/exercise-library/lib/formatExerciseCatalog";
import {
	useExerciseEditor,
	type ExerciseEditorStoreApi,
} from "@/features/exercise-library/hooks/useExerciseEditor";

interface ExerciseEditorProps {
	editor: ExerciseEditorState;
	onClose: () => void;
}

interface ExerciseEditFormProps {
	editor: OpenExerciseEditorState;
	onClose: () => void;
}

interface ExerciseEditorStoreProps {
	store: ExerciseEditorStoreApi;
}

function ExerciseEditDeleteButton({
	store,
	editor,
}: ExerciseEditorStoreProps & { editor: Extract<OpenExerciseEditorState, { state: "edit" }> }) {
	const isDeleting = useStore(store, (s) => s.state.state === "deleting");

	const isBusy = useStore(
		store,
		(s) =>
			s.state.state === "saving" || s.state.state === "deleting" || s.state.state === "combining",
	);

	const send = useStore(store, (s) => s.send);

	return (
		<AlertDialogDestructive
			title={`Delete ${editor.exercise.name}?`}
			description="This exercise will be permanently removed."
			handleDelete={() => send({ event: "DELETE" })}>
			<Button
				type="button"
				variant="destructive"
				disabled={editor.exercise.workoutCount > 0 || isBusy}>
				<ExerciseMutationLabel
					isPending={isDeleting}
					label="Delete"
					pendingLabel="Deleting"
				/>
			</Button>
		</AlertDialogDestructive>
	);
}

function ExerciseEditNameField({ store }: ExerciseEditorStoreProps) {
	const name = useStore(store, (s) => s.name);

	const send = useStore(store, (s) => s.send);

	return (
		<Field>
			<FieldLabel htmlFor="exercise-name">Name</FieldLabel>
			<FieldContent>
				<Input
					id="exercise-name"
					maxLength={MAX_EXERCISE_NAME_LENGTH}
					value={name}
					onChange={(event) => send({ event: "NAME_CHANGED", name: event.target.value })}
					autoComplete="off"
				/>
			</FieldContent>
		</Field>
	);
}

function ExerciseEditCategoriesField({ store }: ExerciseEditorStoreProps) {
	const categories = useStore(store, (s) => s.categories);

	const send = useStore(store, (s) => s.send);

	return (
		<div className="flex flex-col gap-2">
			<p className="text-sm font-medium">Categories</p>
			<MuscleGroupMultiSelect
				selectedCategories={categories}
				onChange={(nextCategories) =>
					send({ event: "CATEGORIES_CHANGED", categories: nextCategories })
				}
			/>
			{categories.length === 0 && (
				<p className="text-sm text-muted-foreground">Won&apos;t appear in category browse.</p>
			)}
		</div>
	);
}

function ExerciseEditSaveButton({ store }: ExerciseEditorStoreProps) {
	const canSave = useStore(store, (s) => s.name.trim().length > 0 && s.state.state === "editing");

	const isSaving = useStore(store, (s) => s.state.state === "saving");

	const send = useStore(store, (s) => s.send);

	return (
		<Button
			type="button"
			onClick={() => send({ event: "SAVE" })}
			disabled={!canSave}>
			<ExerciseMutationLabel
				isPending={isSaving}
				label="Save"
				pendingLabel="Saving"
			/>
		</Button>
	);
}

function ExerciseEditMergeDialog({
	store,
	editor,
}: ExerciseEditorStoreProps & { editor: OpenExerciseEditorState }) {
	const state = useStore(store, (s) => s.state);

	const sourceName = useStore(store, (s) => {
		if (editor.state === "edit") return editor.exercise.name;

		if (s.state.state !== "confirmingMerge" && s.state.state !== "combining") return "";

		return s.name.trim();
	});

	const send = useStore(store, (s) => s.send);

	if (state.state !== "confirmingMerge" && state.state !== "combining") return null;

	return (
		<ExerciseMergeDialog
			open
			onOpenChange={(open) => {
				if (!open) send({ event: "CANCEL_MERGE" });
			}}
			sourceName={sourceName}
			targetName={state.existingExercise.name}
			sourceWorkoutCount={editor.state === "edit" ? editor.exercise.workoutCount : 0}
			kind={editor.state}
			onCombine={() => send({ event: "COMBINE" })}
			isCombining={state.state === "combining"}
		/>
	);
}

function ExerciseEditForm({ editor, onClose }: ExerciseEditFormProps) {
	const store = useExerciseEditor({ editor, onClose });

	const workoutCount = editor.state === "edit" ? editor.exercise.workoutCount : 0;

	return (
		<>
			<DialogHeader>
				<DialogTitle>{getExerciseEditorTitle(editor)}</DialogTitle>
			</DialogHeader>

			<div className="flex flex-col gap-5">
				<ExerciseEditNameField store={store} />
				<ExerciseEditCategoriesField store={store} />

				{editor.state === "edit" && (
					<p className="text-sm text-muted-foreground">
						Used in {formatWorkoutCount(workoutCount)}
					</p>
				)}
			</div>

			<DialogFooter className="flex-row justify-end">
				{editor.state === "edit" && (
					<ExerciseEditDeleteButton
						store={store}
						editor={editor}
					/>
				)}
				<ExerciseEditSaveButton store={store} />
			</DialogFooter>
			<ExerciseEditMergeDialog
				store={store}
				editor={editor}
			/>
		</>
	);
}

export default function ExerciseEditor({ editor, onClose }: ExerciseEditorProps) {
	const formKey = editor.state === "edit" ? editor.exercise.id : editor.state;

	return (
		<Dialog
			open={editor.state !== "closed"}
			onOpenChange={(open) => {
				if (!open) onClose();
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
