// import all the functions and variables we need from other files
import { esc } from './utils.js';
import { loadAllWorkouts, saveAllWorkouts, toDifficultyDisplay } from './data-storage.js';
import { openAppModal } from './modal.js';
import { DELETE_WORKOUT_BUTTON, HISTORY_CONTAINER, LAST_WORKOUT_SUMMARY } from './constants.js';
// Build the HTML that shows workout details when expanded
function buildExpandedDetailsHTML(exercise) {
    return `
    <div class="history-exercise-item exercise-card">
      <h3 class="exercise-name">${esc(exercise.name)}</h3>
      <div class="exercise-sets">
        ${exercise.sets.map((set, setIndex) => `
          <div class="exercise-set" data-set-index="${setIndex}">
            <span class="set-number">${setIndex + 1}.</span>
            <span class="set-details">${set.weight} kg × ${set.reps} reps</span>
          </div>
        `).join('')}
      </div>
      <div class="exercise-metadata">
        ${exercise.difficulty ? `
          <div class="exercise-difficulty">
            <span class="label muted">Difficulty:</span>
            <span class="value">${esc(toDifficultyDisplay(exercise.difficulty))}</span>
          </div>`
        : ''}
        ${exercise.notes ? `
          <div class="exercise-notes">
            <span class="label muted">Note:</span>
            <span class="value">${esc(exercise.notes)}</span>
          </div>`
        : ''}
      </div>
    </div>
  `;
}
// Generate HTML for a workout summary card
function buildSummaryCardHTML(workout, index = null, showDeleteButton = false) {
    // Calculate workout duration (will add this later)
    const workoutDuration = '45m';
    // Extract unique muscle groups (will add this later)
    const muscleGroups = ['Chest', 'Triceps', 'Shoulders'];
    // Calculate PRs (will add this later)
    const prsSet = 0;
    // Calculate the volume for a single set (weight × reps)
    const calculateSetVolume = (set) => {
        return (set.weight || 0) * (set.reps || 0);
    };
    // Calculate the total volume for all sets in an exercise
    const calculateExerciseVolume = (exercise) => {
        return exercise.sets.reduce((total, set) => total + calculateSetVolume(set), 0);
    };
    // Calculate the total volume for the entire workout
    const calculateTotalVolume = (workout) => {
        return workout.exercises.reduce((total, exercise) => total + calculateExerciseVolume(exercise), 0);
    };
    const totalVolume = calculateTotalVolume(workout);
    return `
    <div class="workout-summary-card" ${index !== null ? `data-workout-index="${index}"` : ''}>
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
                <span class="workout-volume">${totalVolume || '0'} kg</span>
              </div>
              ${prsSet > 0 ? `
                <span class="pr-tag">${prsSet} PRs</span>
              ` : ''}
            </div>
          </div>
          <div class="workout-muscle-groups">
            ${muscleGroups.map(group => `
              <span class="muscle-tag">${group}</span>
            `).join('')}
          </div>
        </div>
      </div> <!-- Close workout-summary -->
      <div class="workout-details" hidden>
        ${workout.exercises.map(exercise => buildExpandedDetailsHTML(exercise)).join('')}
        ${showDeleteButton ? `
          <div class="workout-details-footer">
            <button type="button" 
                    class="delete-button danger" 
                    aria-label="Delete workout"
                    data-workout-index="${index}">
              <span aria-hidden="true">Delete Workout</span>
            </button>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}
// Set up click handlers for a workout card
function setupWorkoutCard(workoutCard) {
    // Find elements within the workout card
    const workoutSummary = workoutCard.querySelector('.workout-summary');
    const workoutDetails = workoutCard.querySelector('.workout-details');
    if (!workoutSummary || !workoutDetails)
        return;
    // Initially hide the details
    workoutDetails.style.display = 'none';
    // Toggle function
    const toggleExpandDetails = (event) => {
        // Don't toggle if clicking on the delete button or its children
        if (event.target && event.target.closest('.delete-button')) {
            return;
        }
        // Toggle the display of the details
        const isHidden = workoutDetails.style.display === 'none';
        workoutDetails.style.display = isHidden ? 'flex' : 'none';
        workoutCard.setAttribute('aria-expanded', String(isHidden));
    };
    // Add click event listener to the summary
    workoutSummary.addEventListener('click', toggleExpandDetails);
    // Make the summary focusable and add ARIA attributes for accessibility
    workoutSummary.setAttribute('tabindex', '0');
    workoutSummary.setAttribute('role', 'button');
    workoutSummary.setAttribute('aria-expanded', 'false');
    workoutSummary.setAttribute('aria-controls', 'workout-details');
}
// Show the latest saved workout on the dashboard
export function updateLastWorkoutSummary() {
    // Check if the summary container exists
    if (!LAST_WORKOUT_SUMMARY)
        return;
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
    const workoutCard = LAST_WORKOUT_SUMMARY.querySelector('.workout-summary-card');
    if (workoutCard) {
        setupWorkoutCard(workoutCard);
    }
}
// Delete a workout by index
function deleteWorkout(workoutIndex) {
    const allWorkouts = loadAllWorkouts();
    const workoutToDelete = allWorkouts[workoutIndex];
    if (!workoutToDelete)
        return;
    openAppModal({
        title: 'Delete workout?',
        message: `Delete workout "${workoutToDelete.name}" from ${workoutToDelete.date}? This cannot be undone.`,
        primaryText: 'Delete',
        primaryButtonClass: 'danger',
        secondaryText: 'Cancel',
        onPrimary: () => {
            const updatedWorkouts = loadAllWorkouts();
            if (!updatedWorkouts[workoutIndex])
                return;
            // Removes workout from array
            updatedWorkouts.splice(workoutIndex, 1);
            // Save the updated array
            saveAllWorkouts(updatedWorkouts);
            // Re-render the history list
            renderHistory();
            // Update the last workout summary
            updateLastWorkoutSummary();
        },
        // Cancel the deletion
        onSecondary: null,
    });
}
// Render the full list of saved workouts in the History page
export function renderHistory() {
    if (!HISTORY_CONTAINER)
        return;
    // Clear existing content
    HISTORY_CONTAINER.innerHTML = '';
    const allWorkouts = loadAllWorkouts();
    // If no workouts, display empty state
    if (allWorkouts.length === 0) {
        HISTORY_CONTAINER.innerHTML = `
      <div class="empty-state">
        <p class="empty-message">No workouts saved yet.</p>
      </div>
    `;
    }
    else {
        // Render workouts in reverse chronological order (newest first)
        HISTORY_CONTAINER.innerHTML = allWorkouts
            .map((workout, index) => buildSummaryCardHTML(workout, index, true))
            .reverse()
            .join('');
    }
    // For each workout, setup workout card
    HISTORY_CONTAINER.querySelectorAll('.workout-summary-card').forEach((workoutCard) => {
        workoutCard && setupWorkoutCard(workoutCard);
        // Setup delete button handler for each workout card
        if (DELETE_WORKOUT_BUTTON) {
            DELETE_WORKOUT_BUTTON.addEventListener('click', () => {
                const WorkoutIndexString = DELETE_WORKOUT_BUTTON === null || DELETE_WORKOUT_BUTTON === void 0 ? void 0 : DELETE_WORKOUT_BUTTON.getAttribute('data-workout-index');
                if (!WorkoutIndexString)
                    return;
                // Convert the index to a number
                const workoutIndex = parseInt(WorkoutIndexString, 10);
                // Delete the workout
                deleteWorkout(workoutIndex);
            });
        }
    });
}
//# sourceMappingURL=history.js.map