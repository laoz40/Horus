import { create } from "zustand";

export interface HistoryUiState {
	deletedWorkoutIds: Set<string>;
}

export interface HistoryUiActions {
	markWorkoutDeleted: (workoutId: string) => void;
	clearDeletedWorkoutIds: () => void;
}

export type HistoryUiStore = HistoryUiState & HistoryUiActions;

const createInitialHistoryUiState = (): HistoryUiState => ({
	deletedWorkoutIds: new Set<string>(),
});

export const selectDeletedWorkoutIds = (state: HistoryUiStore) => state.deletedWorkoutIds;

export const useHistoryUiStore = create<HistoryUiStore>()((set) => ({
	...createInitialHistoryUiState(),
	markWorkoutDeleted: (workoutId) => {
		set((state) => ({
			deletedWorkoutIds: new Set(state.deletedWorkoutIds).add(workoutId),
		}));
	},
	clearDeletedWorkoutIds: () => {
		set(createInitialHistoryUiState());
	},
}));
