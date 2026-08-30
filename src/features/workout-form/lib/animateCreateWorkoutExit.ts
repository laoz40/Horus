const CREATE_WORKOUT_EXIT_DURATION_MS = 175;

export function animateCreateWorkoutExit(onComplete: () => void): void {
	document.querySelector(".create-workout-page")?.classList.add("page-slide-down");

	window.setTimeout(onComplete, CREATE_WORKOUT_EXIT_DURATION_MS);
}
