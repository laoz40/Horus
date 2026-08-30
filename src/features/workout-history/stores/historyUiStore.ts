import { create } from "zustand";

export interface HistoryUiState {
	deletedWorkoutIds: Set<string>;
}

export type HistoryUiStore = HistoryUiState;

const createInitialHistoryUiState = (): HistoryUiState => ({
	deletedWorkoutIds: new Set<string>(),
});

export const selectDeletedWorkoutIds = (state: HistoryUiStore) => state.deletedWorkoutIds;

export const useHistoryUiStore = create<HistoryUiStore>()(() => ({
	...createInitialHistoryUiState(),
}));

export function markWorkoutDeleted(workoutId: string): void {
	useHistoryUiStore.setState((state) => ({
		deletedWorkoutIds: new Set(state.deletedWorkoutIds).add(workoutId),
	}));
}

export function clearDeletedWorkoutIds(): void {
	useHistoryUiStore.setState(createInitialHistoryUiState());
}
