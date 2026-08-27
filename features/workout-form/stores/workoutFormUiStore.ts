import { create } from "zustand";

import type { WorkoutFormData } from "@/features/workout-form/lib/types";

export interface WorkoutFormUiState {
	createWorkoutDraft: WorkoutFormData | null;
	selectedExerciseId: string | null;
	isEditing: boolean;
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
	selectedExerciseId: null,
	isEditing: false,
	scrollTargetId: null,
	startedAtMs: Date.now(),
	isRecentSetsDialogOpen: false,
	recentSetsExerciseName: "",
	isRestTimerDrawerOpen: false,
	restTimerStartedAtMs: null,
});

export const selectSelectedExerciseId = (state: WorkoutFormUiStore) => state.selectedExerciseId;
export const selectCreateWorkoutDraft = (state: WorkoutFormUiStore) => state.createWorkoutDraft;
export const selectIsEditing = (state: WorkoutFormUiStore) => state.isEditing;
export const selectScrollTargetId = (state: WorkoutFormUiStore) => state.scrollTargetId;
export const selectStartedAtMs = (state: WorkoutFormUiStore) => state.startedAtMs;
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
		selectedExerciseId: null,
		isEditing: false,
		scrollTargetId: null,
		startedAtMs: Date.now() - Math.max(0, initialDurationSeconds ?? 0) * 1000,
		isRecentSetsDialogOpen: false,
		recentSetsExerciseName: "",
		isRestTimerDrawerOpen: false,
		restTimerStartedAtMs: null,
	});
}

export function setCreateWorkoutDraft(draft: WorkoutFormData | null): void {
	useWorkoutFormUiStore.setState({ createWorkoutDraft: draft });
}

export function selectExercise(exerciseId: string | null): void {
	useWorkoutFormUiStore.setState((state) => ({
		selectedExerciseId: exerciseId,
		isEditing: exerciseId ? state.isEditing : false,
	}));
}

export function toggleExerciseEdit(): void {
	useWorkoutFormUiStore.setState((state) => {
		if (!state.selectedExerciseId) {
			return state;
		}

		return {
			isEditing: !state.isEditing,
		};
	});
}

export function setExerciseEdit(value: boolean): void {
	useWorkoutFormUiStore.setState((state) => ({
		isEditing: state.selectedExerciseId ? value : false,
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

export function resetRecentSetsDialog(): void {
	useWorkoutFormUiStore.setState({
		isRecentSetsDialogOpen: false,
		recentSetsExerciseName: "",
	});
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
