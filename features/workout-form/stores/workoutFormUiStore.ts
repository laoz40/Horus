import { create } from "zustand";

export interface RecentCompletedSet {
	weight: number;
	reps: number;
	time: string;
}

export interface WorkoutFormUiState {
	selectedExerciseId: string | null;
	isEditing: boolean;
	scrollTargetId: string | null;
	startedAtMs: number;
	isRecentSetsDialogOpen: boolean;
	recentSetsExerciseName: string;
	isRecentSetsLoading: boolean;
	recentSetsError: string | null;
	recentCompletedSets: RecentCompletedSet[];
}

export interface WorkoutFormUiActions {
	initializeWorkoutSession: (initialDurationSeconds?: number | null) => void;
	selectExercise: (exerciseId: string | null) => void;
	toggleExerciseEdit: () => void;
	setExerciseEdit: (value: boolean) => void;
	setScrollTarget: (exerciseId: string | null) => void;
	openRecentSetsDialog: (exerciseName: string) => void;
	setRecentSetsDialogOpen: (open: boolean) => void;
	setRecentSetsLoading: (loading: boolean) => void;
	setRecentSetsError: (error: string | null) => void;
	setRecentCompletedSets: (sets: RecentCompletedSet[]) => void;
	resetRecentSetsDialog: () => void;
	resetWorkoutFormUi: () => void;
}

export type WorkoutFormUiStore = WorkoutFormUiState & WorkoutFormUiActions;

const createInitialWorkoutFormUiState = (): WorkoutFormUiState => ({
	selectedExerciseId: null,
	isEditing: false,
	scrollTargetId: null,
	startedAtMs: Date.now(),
	isRecentSetsDialogOpen: false,
	recentSetsExerciseName: "",
	isRecentSetsLoading: false,
	recentSetsError: null,
	recentCompletedSets: [],
});

export const selectSelectedExerciseId = (state: WorkoutFormUiStore) => state.selectedExerciseId;
export const selectIsEditing = (state: WorkoutFormUiStore) => state.isEditing;
export const selectScrollTargetId = (state: WorkoutFormUiStore) => state.scrollTargetId;
export const selectStartedAtMs = (state: WorkoutFormUiStore) => state.startedAtMs;
export const selectIsRecentSetsDialogOpen = (state: WorkoutFormUiStore) =>
	state.isRecentSetsDialogOpen;
export const selectRecentSetsExerciseName = (state: WorkoutFormUiStore) =>
	state.recentSetsExerciseName;
export const selectIsRecentSetsLoading = (state: WorkoutFormUiStore) =>
	state.isRecentSetsLoading;
export const selectRecentSetsError = (state: WorkoutFormUiStore) => state.recentSetsError;
export const selectRecentCompletedSets = (state: WorkoutFormUiStore) =>
	state.recentCompletedSets;

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
			isEditing: exerciseId ? state.isEditing : false,
		}));
	},
	toggleExerciseEdit: () => {
		set((state) => {
			if (!state.selectedExerciseId) {
				return state;
			}

			return {
				isEditing: !state.isEditing,
			};
		});
	},
	setExerciseEdit: (value) => {
		set((state) => ({
			isEditing: state.selectedExerciseId ? value : false,
		}));
	},
	setScrollTarget: (exerciseId) => {
		set({ scrollTargetId: exerciseId });
	},
	openRecentSetsDialog: (exerciseName) => {
		set({
			isRecentSetsDialogOpen: true,
			recentSetsExerciseName: exerciseName,
			isRecentSetsLoading: true,
			recentSetsError: null,
			recentCompletedSets: [],
		});
	},
	setRecentSetsDialogOpen: (open) => {
		set({ isRecentSetsDialogOpen: open });
	},
	setRecentSetsLoading: (loading) => {
		set({ isRecentSetsLoading: loading });
	},
	setRecentSetsError: (error) => {
		set({ recentSetsError: error });
	},
	setRecentCompletedSets: (sets) => {
		set({ recentCompletedSets: sets });
	},
	resetRecentSetsDialog: () => {
		set({
			isRecentSetsDialogOpen: false,
			recentSetsExerciseName: "",
			isRecentSetsLoading: false,
			recentSetsError: null,
			recentCompletedSets: [],
		});
	},
	resetWorkoutFormUi: () => {
		set(createInitialWorkoutFormUiState());
	},
}));
