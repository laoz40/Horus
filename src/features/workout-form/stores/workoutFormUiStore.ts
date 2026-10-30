import { create } from "zustand";

import type { Workout } from "@/features/workout-form/lib/validateWorkout";
import {
	exerciseSelectionReducer,
	type ExerciseSelection,
} from "@/features/workout-form/lib/exerciseSelection";
import { restTimerReducer, type RestTimerState } from "@/features/workout-form/lib/restTimer";

export interface WorkoutFormUiState {
	createWorkoutDraft: Workout | null;
	exerciseSelection: ExerciseSelection;
	scrollTargetId: string | null;
	startedAtMs: number;
	isRecentSetsDialogOpen: boolean;
	recentSetsExerciseName: string;
	restTimer: RestTimerState;
}

export type WorkoutFormUiStore = WorkoutFormUiState;

const createInitialWorkoutFormUiState = (): WorkoutFormUiState => ({
	createWorkoutDraft: null,
	exerciseSelection: { kind: "none" },
	scrollTargetId: null,
	startedAtMs: Date.now(),
	isRecentSetsDialogOpen: false,
	recentSetsExerciseName: "",
	restTimer: { kind: "idle" },
});

// Until the user selects or scrolls to an exercise, the first entry is selected.
export const selectSelectedExerciseId = (state: WorkoutFormUiStore, exerciseIds: string[]) =>
	state.exerciseSelection.kind === "none"
		? (exerciseIds[0] ?? null)
		: state.exerciseSelection.exerciseId;

export const selectIsEditingExercise = (state: WorkoutFormUiStore) =>
	state.exerciseSelection.kind === "editing";

export const selectCreateWorkoutDraft = (state: WorkoutFormUiStore) => state.createWorkoutDraft;

export const selectScrollTargetId = (state: WorkoutFormUiStore) => state.scrollTargetId;

export const selectIsRecentSetsDialogOpen = (state: WorkoutFormUiStore) =>
	state.isRecentSetsDialogOpen;

export const selectRecentSetsExerciseName = (state: WorkoutFormUiStore) =>
	state.recentSetsExerciseName;

export const selectIsRestTimerDrawerOpen = (state: WorkoutFormUiStore) =>
	state.restTimer.kind === "expanded";

export const selectRestTimerStartedAtMs = (state: WorkoutFormUiStore) =>
	state.restTimer.kind === "idle" ? null : state.restTimer.startedAtMs;

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
		restTimer: { kind: "idle" },
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

export function toggleExerciseEdit(exerciseId: string | null): void {
	useWorkoutFormUiStore.setState((state) => ({
		exerciseSelection: exerciseSelectionReducer(state.exerciseSelection, {
			kind: "toggleEditing",
			exerciseId,
		}),
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
	useWorkoutFormUiStore.setState((state) => ({
		restTimer: restTimerReducer(state.restTimer, { kind: "start", startedAtMs: Date.now() }),
	}));
}

export function setRestTimerDrawerOpen(open: boolean): void {
	useWorkoutFormUiStore.setState((state) => ({
		restTimer: restTimerReducer(state.restTimer, { kind: open ? "openDrawer" : "closeDrawer" }),
	}));
}

export function finishRestTimer(): void {
	useWorkoutFormUiStore.setState((state) => ({
		restTimer: restTimerReducer(state.restTimer, { kind: "finish" }),
	}));
}

export function resetWorkoutFormUi(): void {
	const createWorkoutDraft = useWorkoutFormUiStore.getState().createWorkoutDraft;
	useWorkoutFormUiStore.setState({
		...createInitialWorkoutFormUiState(),
		createWorkoutDraft,
	});
}
