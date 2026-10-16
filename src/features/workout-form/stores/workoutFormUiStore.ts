import { create } from "zustand";

import type { Workout } from "@/features/workout-form/lib/validateWorkout";
import {
	exerciseSelectionReducer,
	type ExerciseSelection,
} from "@/features/workout-form/lib/exerciseSelection";

export interface WorkoutFormUiState {
	createWorkoutDraft: Workout | null;
	exerciseSelection: ExerciseSelection;
	scrollTargetId: string | null;
	startedAtMs: number;
	isRecentSetsDialogOpen: boolean;
	recentSetsExerciseName: string;
	isRestTimerDrawerOpen: boolean;
	restTimerStartedAtMs: number | null;
}

export type WorkoutFormUiStore = WorkoutFormUiState;

const createInitialWorkoutFormUiState = (): WorkoutFormUiState => ({
	createWorkoutDraft: null,
	exerciseSelection: { kind: "none" },
	scrollTargetId: null,
	startedAtMs: Date.now(),
	isRecentSetsDialogOpen: false,
	recentSetsExerciseName: "",
	isRestTimerDrawerOpen: false,
	restTimerStartedAtMs: null,
});

export const selectSelectedExerciseId = (state: WorkoutFormUiStore) =>
	state.exerciseSelection.kind === "none" ? null : state.exerciseSelection.exerciseId;

export const selectIsEditingExercise = (state: WorkoutFormUiStore) =>
	state.exerciseSelection.kind === "editing";

export const selectCreateWorkoutDraft = (state: WorkoutFormUiStore) => state.createWorkoutDraft;

export const selectScrollTargetId = (state: WorkoutFormUiStore) => state.scrollTargetId;

export const selectIsRecentSetsDialogOpen = (state: WorkoutFormUiStore) =>
	state.isRecentSetsDialogOpen;

export const selectRecentSetsExerciseName = (state: WorkoutFormUiStore) =>
	state.recentSetsExerciseName;

export const selectIsRestTimerDrawerOpen = (state: WorkoutFormUiStore) =>
	state.isRestTimerDrawerOpen;

export const selectRestTimerStartedAtMs = (state: WorkoutFormUiStore) => state.restTimerStartedAtMs;

export const useWorkoutFormUiStore = create<WorkoutFormUiStore>()(() => ({
	...createInitialWorkoutFormUiState(),
}));

export function initializeWorkoutSession(initialDurationSeconds = 0): void {
	useWorkoutFormUiStore.setState({
		exerciseSelection: { kind: "none" },
		scrollTargetId: null,
		startedAtMs: Date.now() - Math.max(0, initialDurationSeconds ?? 0) * 1000,
		isRecentSetsDialogOpen: false,
		recentSetsExerciseName: "",
		isRestTimerDrawerOpen: false,
		restTimerStartedAtMs: null,
	});
}

export function setCreateWorkoutDraft(draft: Workout | null): void {
	useWorkoutFormUiStore.setState({ createWorkoutDraft: draft });
}

export function selectExercise(exerciseId: string | null): void {
	useWorkoutFormUiStore.setState((state) => ({
		exerciseSelection: exerciseSelectionReducer(state.exerciseSelection, {
			kind: "selectExercise",
			exerciseId,
		}),
	}));
}

export function toggleExerciseEdit(): void {
	useWorkoutFormUiStore.setState((state) => ({
		exerciseSelection: exerciseSelectionReducer(state.exerciseSelection, { kind: "toggleEditing" }),
	}));
}

export function selectExerciseAfterDeletion(nextExerciseId: string | null): void {
	useWorkoutFormUiStore.setState((state) => ({
		exerciseSelection: exerciseSelectionReducer(state.exerciseSelection, {
			kind: "exerciseDeleted",
			nextExerciseId,
		}),
	}));
}

export function setScrollTarget(exerciseId: string | null): void {
	useWorkoutFormUiStore.setState({ scrollTargetId: exerciseId });
}

export function openRecentSetsDialog(exerciseName: string): void {
	useWorkoutFormUiStore.setState({
		isRecentSetsDialogOpen: true,
		recentSetsExerciseName: exerciseName,
	});
}

export function setRecentSetsDialogOpen(open: boolean): void {
	useWorkoutFormUiStore.setState({ isRecentSetsDialogOpen: open });
}

export function startRestTimer(): void {
	useWorkoutFormUiStore.setState({
		isRestTimerDrawerOpen: true,
		restTimerStartedAtMs: Date.now(),
	});
}

export function setRestTimerDrawerOpen(open: boolean): void {
	useWorkoutFormUiStore.setState({ isRestTimerDrawerOpen: open });
}

export function finishRestTimer(): void {
	useWorkoutFormUiStore.setState({
		isRestTimerDrawerOpen: false,
		restTimerStartedAtMs: null,
	});
}

export function resetWorkoutFormUi(): void {
	const createWorkoutDraft = useWorkoutFormUiStore.getState().createWorkoutDraft;
	useWorkoutFormUiStore.setState({
		...createInitialWorkoutFormUiState(),
		createWorkoutDraft,
	});
}
