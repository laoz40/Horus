import { create } from "zustand";

export interface WorkoutFormUiState {
	selectedExerciseId: string | null;
	isEditingSelectedExercise: boolean;
	scrollTargetId: string | null;
	startedAtMs: number;
}

export interface WorkoutFormUiActions {
	initializeWorkoutSession: (initialDurationSeconds?: number | null) => void;
	selectExercise: (exerciseId: string | null) => void;
	toggleExerciseEdit: () => void;
	setExerciseEdit: (value: boolean) => void;
	setScrollTarget: (exerciseId: string | null) => void;
	resetWorkoutFormUi: () => void;
}

export type WorkoutFormUiStore = WorkoutFormUiState & WorkoutFormUiActions;

const createInitialWorkoutFormUiState = (): WorkoutFormUiState => ({
	selectedExerciseId: null,
	isEditingSelectedExercise: false,
	scrollTargetId: null,
	startedAtMs: Date.now(),
});

export const selectSelectedExerciseId = (state: WorkoutFormUiStore) => state.selectedExerciseId;
export const selectIsEditingSelectedExercise = (state: WorkoutFormUiStore) =>
	state.isEditingSelectedExercise;
export const selectScrollTargetId = (state: WorkoutFormUiStore) => state.scrollTargetId;
export const selectStartedAtMs = (state: WorkoutFormUiStore) => state.startedAtMs;

export const useWorkoutFormUiStore = create<WorkoutFormUiStore>()((set) => ({
	...createInitialWorkoutFormUiState(),
	initializeWorkoutSession: (initialDurationSeconds = 0) => {
		set({
			...createInitialWorkoutFormUiState(),
			startedAtMs: Date.now() - Math.max(0, initialDurationSeconds ?? 0) * 1000,
		});
	},
	selectExercise: (exerciseId) => {
		set((state) => ({
			selectedExerciseId: exerciseId,
			isEditingSelectedExercise: exerciseId ? state.isEditingSelectedExercise : false,
		}));
	},
	toggleExerciseEdit: () => {
		set((state) => {
			if (!state.selectedExerciseId) {
				return state;
			}

			return {
				isEditingSelectedExercise: !state.isEditingSelectedExercise,
			};
		});
	},
	setExerciseEdit: (value) => {
		set((state) => ({
			isEditingSelectedExercise: state.selectedExerciseId ? value : false,
		}));
	},
	setScrollTarget: (exerciseId) => {
		set({ scrollTargetId: exerciseId });
	},
	resetWorkoutFormUi: () => {
		set(createInitialWorkoutFormUiState());
	},
}));
