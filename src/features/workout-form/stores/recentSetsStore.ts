import { create } from "zustand";

type RecentSetsStore = {
	dialog: {
		state: "closed" | "open";
		exerciseName: string;
	};
	actions: {
		open: (exerciseName: string) => void;
		setOpen: (open: boolean) => void;
		reset: () => void;
	};
};

export const useRecentSetsStore = create<RecentSetsStore>()((set) => ({
	dialog: { state: "closed", exerciseName: "" },
	actions: {
		open: (exerciseName) => set({ dialog: { state: "open", exerciseName } }),
		setOpen: (open) =>
			set((store) => ({
				dialog: { ...store.dialog, state: open ? "open" : "closed" },
			})),
		reset: () => set({ dialog: { state: "closed", exerciseName: "" } }),
	},
}));
