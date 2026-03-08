import { toast } from "sonner";

const toastPosition = "top-center";
const topMargin = {
	top: "40px",
};
const actionButtonStyle = {
	background: "var(--muted)",
	color: "var(--muted-foreground)",
};

// const undoAction = {
// 	label: "Undo",
// 	onClick: () => {
// 		toast.dismiss();
// 	},
// };
const dismissAction = {
	label: "dismiss",
	onClick: () => {
		toast.dismiss();
	},
};

export const showWorkoutDeletedToast = (workoutName: string) => {
	toast.info(`Deleted ${workoutName}`, {
		position: toastPosition,
		style: topMargin,
		action: dismissAction,
		actionButtonStyle,
	});
};

export const showWorkoutsDeletedToast = (deletedCount: number) => {
	toast.success(`Deleted ${deletedCount} workout${deletedCount === 1 ? "" : "s"}`, {
		position: toastPosition,
		style: topMargin,
		action: dismissAction,
		actionButtonStyle,
	});
};

export const showExerciseDeletedToast = () => {
	toast.info("Exercise deleted", {
		position: toastPosition,
		style: topMargin,
		duration: 2000,
		action: dismissAction,
		actionButtonStyle,
	});
};

export const showSetDeletedToast = () => {
	toast.info("Set deleted", {
		position: toastPosition,
		style: topMargin,
		duration: 2000,
		action: dismissAction,
		actionButtonStyle,
	});
};

export const showWorkoutSavedToast = (workoutName: string) => {
	toast.success(`Saved ${workoutName}`, {
		position: toastPosition,
		action: dismissAction,
		actionButtonStyle,
	});
};

export const showExerciseSearchRateLimitToast = () => {
	toast.error("Too many requests. Try again in a moment.", {
		position: toastPosition,
		style: topMargin,
		action: dismissAction,
		actionButtonStyle,
	});
};

export const showExerciseSearchFailedToast = () => {
	toast.error("Failed to fetch exercises.", {
		position: toastPosition,
		style: topMargin,
		action: dismissAction,
		actionButtonStyle,
	});
};

export const showErrorToast = (message: string) => {
	toast.error(message, {
		position: toastPosition,
		style: topMargin,
		action: dismissAction,
		actionButtonStyle,
	});
};

export const showInfoToast = (message: string) => {
	toast.info(message, {
		position: toastPosition,
		style: topMargin,
		action: dismissAction,
		actionButtonStyle,
	});
};
