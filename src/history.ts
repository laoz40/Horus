// import all the functions and variables we need from other files

import {
	EXERCISE_FORM_CONTAINER,
	HISTORY_CONTAINER,
	LAST_WORKOUT_SUMMARY,
	WORKOUT_DATE_TEXT,
	WORKOUT_NAME_INPUT,
} from "./constants.js";
import {
	getCurrentWorkout,
	loadAllExerciseNames,
	loadAllWorkouts,
	populateExerciseDatalist,
	saveAllExerciseNames,
	saveAllWorkouts,
	setCurrentWorkout,
	setupNewWorkout,
	toDifficultyDisplay,
	validateWorkoutData,
} from "./data-storage.js";
import { clearWorkoutDraft } from "./draft.js";
import { modalMessages, openModal } from "./modal.js";
import { showPage } from "./nav.js";
import type {
	EditWorkoutData,
	Exercise,
	ExerciseSet,
	Workout,
} from "./types.js";
import { esc, formatDisplayDate, weekdays } from "./utils.js";
import {
	createExerciseForm,
	readExercisesFromForms,
} from "./workout-builder.js";

// Build the HTML that shows workout details when expanded
function buildExpandedDetailsHTML(exercise: Exercise) {
	return `
    <div class="history-exercise-item exercise-card">
      <h3 class="exercise-name">${esc(exercise.name)}</h3>
      <div class="exercise-sets">
        ${exercise.sets
					.map(
						(set, setIndex) => `
          <div class="exercise-set" data-set-index="${setIndex}">
            <span class="set-number">${setIndex + 1}.</span>
            <span class="set-details">${set.weight} kg × ${set.reps} reps</span>
          </div>
        `,
					)
					.join("")}
      </div>
      <div class="exercise-metadata">
        ${
					exercise.difficulty
						? `
          <div class="exercise-difficulty">
            <span class="label muted">Difficulty:</span>
            <span class="value">${esc(toDifficultyDisplay(exercise.difficulty))}</span>
          </div>`
						: ""
				}
        ${
					exercise.notes
						? `
          <div class="exercise-notes">
            <span class="label muted">Note:</span>
            <span class="value">${esc(exercise.notes)}</span>
          </div>`
						: ""
				}
      </div>
    </div>
  `;
}

// Generate HTML for a workout summary card
function buildSummaryCardHTML(
	workout: Workout,
	index: number | null = null,
	showDeleteButton = false,
) {
	// Calculate workout duration (will add this later)
	const workoutDuration = "45m";

	// Extract unique muscle groups (will add this later)
	const muscleGroups = ["Chest", "Triceps", "Shoulders"];

	// Calculate PRs (will add this later)
	const prsSet = 0;

	// Calculate the volume for a single set (weight × reps)
	const calculateSetVolume = (set: ExerciseSet): number => {
		return (set.weight || 0) * (set.reps || 0);
	};
	// Calculate the total volume for all sets in an exercise
	const calculateExerciseVolume = (exercise: Exercise): number => {
		return exercise.sets.reduce(
			(total, set) => total + calculateSetVolume(set),
			0,
		);
	};
	// Calculate the total volume for the entire workout
	const calculateTotalVolume = (workout: Workout): number => {
		return workout.exercises.reduce(
			(total, exercise) => total + calculateExerciseVolume(exercise),
			0,
		);
	};

	const totalVolume = calculateTotalVolume(workout);

	return `
    <div class="workout-summary-card" ${index !== null ? `data-workout-index="${index}"` : ""}>
      <div class="workout-summary">
        <div class="workout-header">
          <div class="workout-meta">
            <div class="workout-title-row">
              <h3 class="workout-title">${esc(workout.name)}</h3>
              <div class="workout-details-row">
                  <span class="workout-duration">${workoutDuration}</span>
                  <span class="workout-date">${esc(workout.date)}</span>
              </div>
            </div>
            <div class="workout-stats-row">
              <div class="workout-stats">
                <span class="exercise-count">${workout.exercises.length} Exercises</span>
                <span class="workout-volume">${totalVolume || "0"} kg</span>
              </div>
              ${
								prsSet > 0
									? `
                <span class="pr-tag">${prsSet} PRs</span>
              `
									: ""
							}
            </div>
          </div>
          <div class="workout-muscle-groups">
            ${muscleGroups
							.map(
								(group) => `
              <span class="muscle-tag">${group}</span>
            `,
							)
							.join("")}
          </div>
        </div>
      </div> <!-- Close workout-summary -->
      <div class="workout-details" hidden>
        ${workout.exercises
					.map((exercise) => buildExpandedDetailsHTML(exercise))
					.join("")}
        ${
					showDeleteButton
						? `
          <div class="workout-details-footer">
            <button type="button" 
                    class="edit-button secondary" 
                    aria-label="Edit workout"
                    data-workout-index="${index}">
              <span aria-hidden="true">Edit</span>
            </button>
            <button type="button" 
                    class="delete-button danger" 
                    aria-label="Delete workout"
                    data-workout-index="${index}">
              <span aria-hidden="true">Delete</span>
            </button>
          </div>
        `
						: ""
				}
      </div>
    </div>
  `;
}

// Set up click handlers for a workout card expand/collapse
function setupExpandCollapseCard(workoutCard: HTMLElement) {
	// Find elements within the workout card
	const WORKOUT_SUMMARY = workoutCard.querySelector(
		".workout-summary",
	) as HTMLElement;
	const WORKOUT_DETAILS = workoutCard.querySelector(
		".workout-details",
	) as HTMLElement;

	if (!WORKOUT_SUMMARY || !WORKOUT_DETAILS) return;

	// Initially hide the details
	WORKOUT_DETAILS.style.display = "none";

	// Toggle function
	const toggleExpandDetails = (event: Event) => {
		// Don't toggle if clicking on the delete button or its children
		if (
			event.target &&
			(event.target as HTMLElement).closest(".delete-button")
		) {
			return;
		}

		// Toggle the display of the details
		const isHidden = WORKOUT_DETAILS.style.display === "none";
		WORKOUT_DETAILS.style.display = isHidden ? "flex" : "none";
		workoutCard.setAttribute("aria-expanded", String(isHidden));
	};

	// Add click event listener to the summary
	WORKOUT_SUMMARY.addEventListener("click", toggleExpandDetails);

	// Make the summary focusable and add ARIA attributes for accessibility
	WORKOUT_SUMMARY.setAttribute("tabindex", "0");
	WORKOUT_SUMMARY.setAttribute("role", "button");
	WORKOUT_SUMMARY.setAttribute("aria-expanded", "false");
	WORKOUT_SUMMARY.setAttribute("aria-controls", "workout-details");
}

// Show the latest saved workout on the dashboard
export function updateLastWorkoutSummary() {
	// Check if the summary container exists
	if (!LAST_WORKOUT_SUMMARY) return;

	// Get most recent workout
	const allWorkouts = loadAllWorkouts();
	const lastWorkout = allWorkouts[allWorkouts.length - 1];

	// Display nothing if no workouts
	if (!lastWorkout) {
		LAST_WORKOUT_SUMMARY.innerHTML = ``;
		return;
	}

	// Display the last workout
	LAST_WORKOUT_SUMMARY.innerHTML = `
    <h2 class="section-header-text">Last Workout</h2>
    ${buildSummaryCardHTML(lastWorkout)}
  `;

	// Setup the workout card
	const workoutCard = LAST_WORKOUT_SUMMARY.querySelector(
		".workout-summary-card",
	) as HTMLElement;
	if (workoutCard) {
		setupExpandCollapseCard(workoutCard);
	}
}

// Get the data for the current edit
let currentEditData: EditWorkoutData | null = null;
export function getEditData() {
	return currentEditData;
}
// Update the data for the current edit
export function setEditData(editData: EditWorkoutData | null) {
	currentEditData = editData;
}
export function isInEditMode(): boolean {
	return currentEditData !== null;
}

// Edit a workout by index
function editWorkout(workoutIndex: number) {
	const allWorkouts = loadAllWorkouts();
	const workoutToEdit = allWorkouts[workoutIndex];
	if (
		!workoutToEdit ||
		!workoutToEdit.exercises ||
		workoutToEdit.exercises.length < 1
	)
		return;

	// make a copy of the workout to edit, and set it as the current workout
	const workoutCopy = JSON.parse(JSON.stringify(workoutToEdit));
	setCurrentWorkout(workoutCopy);

	// save a copy of the original workout data
	currentEditData = {
		index: workoutIndex,
		originalWorkout: workoutCopy,
	};

	// show the new workout page
	showPage("new-workout-page");

	// Set the workout name and date
	if (WORKOUT_NAME_INPUT) WORKOUT_NAME_INPUT.value = workoutToEdit.name || "";
	if (WORKOUT_DATE_TEXT)
		WORKOUT_DATE_TEXT.textContent =
			formatDisplayDate(new Date(workoutToEdit.date)) || "";

	// clear the container
	if (!EXERCISE_FORM_CONTAINER) return;
	EXERCISE_FORM_CONTAINER.innerHTML = "";

	// Load the workout into the forms
	workoutToEdit.exercises.forEach((exercise: Exercise) => {
		// Convert values to strings for the form cos typescript
		const exerciseForm = {
			...exercise,
			sets: exercise.sets.map((set) => ({
				weight: set.weight?.toString() || "",
				reps: set.reps?.toString() || "",
			})),
		};
		// create exercise form for each exercise
		EXERCISE_FORM_CONTAINER?.appendChild(createExerciseForm(exerciseForm));
	});
}

function saveWorkout() {
	const currentWorkout = getCurrentWorkout();
	if (!currentWorkout) return;

	// Saves exercises from forms
	currentWorkout.exercises = readExercisesFromForms();

	// Save exercise names for autocomplete
	const exerciseNames = new Set(loadAllExerciseNames());
	// Add all unique exercise names to the set
	currentWorkout.exercises.forEach((ex: Exercise) => {
		// if not empty, add trimmed name to the set
		ex.name && exerciseNames.add(ex.name.trim());
	});
	// Save the names to localStorage in an array sorted alphabetically
	saveAllExerciseNames([...exerciseNames].sort());
	populateExerciseDatalist();

	// Update the last workout summary on the dashboard
	updateLastWorkoutSummary();
	// Refresh the history page to show the new workout
	renderHistory();
}

export function saveNewWorkout() {
	// Validate the workout data
	if (!validateWorkoutData()) return;

	const currentWorkout = getCurrentWorkout();
	if (!currentWorkout) return;

	if (!currentWorkout.name?.trim()) {
		const today = new Date();
		const dayName = weekdays[today.getDay()];
		currentWorkout.name = `${dayName} Workout`;
	}

	saveWorkout();
	// Add the workout to localStorage
	const allWorkouts = loadAllWorkouts();
	allWorkouts.push(currentWorkout);
	saveAllWorkouts(allWorkouts);

	// Display a success message
	openModal(modalMessages.saveWorkout(currentWorkout));
	// Redirect to the history page
	showPage("history-page");
	// Reset the form to a blank state in background and clear the draft
	setupNewWorkout();
	clearWorkoutDraft();
}

export function saveEditedWorkout() {
	// Validate the workout data
	if (!validateWorkoutData()) return;

	const editData = getEditData();
	const currentWorkout = getCurrentWorkout();
	if (!currentWorkout || !editData) return;

	saveWorkout();
	// Update the workout in localStorage
	const allWorkouts = loadAllWorkouts();
	allWorkouts[editData.index] = currentWorkout;
	saveAllWorkouts(allWorkouts);

	// Display a success message
	openModal(modalMessages.updateWorkout(currentWorkout));
	// Redirect to the history page
	showPage("history-page");
	// reset edit data AFTER returning to history page, to not trigger draft save from leaving the page
	setEditData(null);
}

// Delete a workout by index
function deleteWorkout(workoutIndex: number) {
	const allWorkouts = loadAllWorkouts();
	const workoutToDelete = allWorkouts[workoutIndex];
	if (!workoutToDelete) return;

	openModal({
		...modalMessages.deleteWorkout(workoutToDelete),
		// Delete the workout on primary button click
		onPrimary: () => {
			const updatedWorkouts = loadAllWorkouts();
			if (!updatedWorkouts[workoutIndex]) return;

			// Removes workout from array
			updatedWorkouts.splice(workoutIndex, 1);
			// Save the updated array
			saveAllWorkouts(updatedWorkouts);
			// Re-render the history list
			renderHistory();
			// Update the last workout summary
			updateLastWorkoutSummary();
		},
	});
}

// Render the full list of saved workouts in the History page
export function renderHistory() {
	if (!HISTORY_CONTAINER) return;

	// Clear existing content
	HISTORY_CONTAINER.innerHTML = "";

	const allWorkouts = loadAllWorkouts();

	// If no workouts, display empty state
	if (allWorkouts.length === 0) {
		HISTORY_CONTAINER.innerHTML = `
      <div class="empty-state">
        <p class="empty-message">No workouts saved yet.</p>
      </div>
    `;
	} else {
		// Render workouts in reverse chronological order (newest first)
		HISTORY_CONTAINER.innerHTML = allWorkouts
			.map((workout, index) => buildSummaryCardHTML(workout, index, true))
			.reverse()
			.join("");
	}

	// For each workout, setup delete button and edit button
	HISTORY_CONTAINER.querySelectorAll(".workout-summary-card").forEach(
		(workoutCard) => {
			workoutCard && setupExpandCollapseCard(workoutCard as HTMLElement);

			const EDIT_WORKOUT_BUTTON = workoutCard.querySelector(
				".edit-button",
			) as HTMLButtonElement;
			const DELETE_WORKOUT_BUTTON = workoutCard.querySelector(
				".delete-button",
			) as HTMLButtonElement;

			// Setup edit button handler for each workout card
			if (EDIT_WORKOUT_BUTTON) {
				EDIT_WORKOUT_BUTTON.addEventListener("click", () => {
					const WorkoutIndexString =
						EDIT_WORKOUT_BUTTON?.getAttribute("data-workout-index");
					if (!WorkoutIndexString) return;
					// Convert the index to a number
					const workoutIndex = parseInt(WorkoutIndexString, 10);
					// Edit the workout
					editWorkout(workoutIndex);
				});
			}

			// Setup delete button handler for each workout card
			if (DELETE_WORKOUT_BUTTON) {
				DELETE_WORKOUT_BUTTON.addEventListener("click", () => {
					const WorkoutIndexString =
						DELETE_WORKOUT_BUTTON?.getAttribute("data-workout-index");
					if (!WorkoutIndexString) return;
					// Convert the index to a number
					const workoutIndex = parseInt(WorkoutIndexString, 10);
					// Delete the workout
					deleteWorkout(workoutIndex);
				});
			}
		},
	);
}
