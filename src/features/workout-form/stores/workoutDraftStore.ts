import { create } from "zustand";
import type { Workout } from "@/features/workout-form/lib/validateWorkout";

type WorkoutDraftStore = {
	draft: Workout | null;
	actions: {
		setDraft: (draft: Workout | null) => void;
	};
};

export const useWorkoutDraftStore = create<WorkoutDraftStore>()((set) => ({
	draft: null,
	actions: {
		setDraft: (draft) => set({ draft }),
	},
}));
