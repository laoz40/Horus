// import all the functions and variables we need from other files
import { esc } from './utils.js';
import { loadAllWorkouts, saveAllWorkouts, toDifficultyDisplay } from './data-storage.js';
import { openAppModal } from './modal.js';
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
    // Calculate workout duration (placeholder - in real app, this would be calculated from timestamps)
    const workoutDuration = '45m';
    // Extract unique muscle groups (placeholder - in real app, this would come from exercise data)
    const muscleGroups = ['Chest', 'Triceps', 'Shoulders'];
    // Calculate PRs (placeholder - in real app, this would be calculated from exercise history)
    const prsSet = 1;
    // Calculate total volume (placeholder - in real app, this would be calculated from exercise data)
    const totalVolume = '2,340 kg';
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
                <span class="workout-volume">${totalVolume}</span>
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
    const summaryCard = workoutCard.querySelector('.workout-summary');
    const DetailsExpanded = workoutCard.querySelector('.workout-details');
    if (summaryCard && DetailsExpanded) {
        // Initially hide the details
        DetailsExpanded.style.display = 'none';
        // Toggle function
        const toggleExpandDetails = (event) => {
            // Don't toggle if clicking on the delete button or its children
            if (event.target && event.target.closest('.delete-button')) {
                return;
            }
            // Toggle the display of the details
            if (DetailsExpanded.style.display === 'none') {
                DetailsExpanded.style.display = 'flex';
                workoutCard.setAttribute('aria-expanded', 'true');
            }
            else {
                DetailsExpanded.style.display = 'none';
                workoutCard.setAttribute('aria-expanded', 'false');
            }
        };
        // Add click event listener to the summary
        summaryCard.addEventListener('click', toggleExpandDetails);
        // Make the summary focusable and add ARIA attributes for accessibility
        summaryCard.setAttribute('tabindex', '0');
        summaryCard.setAttribute('role', 'button');
        summaryCard.setAttribute('aria-expanded', 'false');
        summaryCard.setAttribute('aria-controls', 'workout-details');
    }
}
// Show the latest saved workout on the dashboard
export function updateLastWorkoutSummary() {
    // Check if the summary container exists
    const summaryContainer = document.getElementById('last-workout-summary');
    if (!summaryContainer)
        return;
    // Get most recent workout
    const allWorkouts = loadAllWorkouts();
    const lastWorkout = allWorkouts[allWorkouts.length - 1];
    // Display nothing if no workouts
    if (!lastWorkout) {
        summaryContainer.innerHTML = ``;
        return;
    }
    // Display the last workout
    summaryContainer.innerHTML = `
    <h2 class="section-header-text">Last Workout</h2>
    ${buildSummaryCardHTML(lastWorkout)}
  `;
    // Setup the workout card
    const workoutCard = summaryContainer.querySelector('.workout-summary-card');
    workoutCard && setupWorkoutCard(workoutCard);
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
    const historyContainer = document.querySelector('.workouts-history');
    if (!historyContainer)
        return;
    // Clear existing content
    historyContainer.innerHTML = '';
    const allWorkouts = loadAllWorkouts();
    // If no workouts, display empty state
    if (allWorkouts.length === 0) {
        historyContainer.innerHTML = `
      <div class="empty-state">
        <p class="empty-message">No workouts saved yet.</p>
      </div>
    `;
    }
    else {
        // Render workouts in reverse chronological order (newest first)
        historyContainer.innerHTML = allWorkouts
            .map((workout, index) => buildSummaryCardHTML(workout, index, true))
            .reverse()
            .join('');
    }
    // For each workout, setup workout card
    historyContainer.querySelectorAll('.workout-summary-card').forEach((workoutCard) => {
        workoutCard && setupWorkoutCard(workoutCard);
        // Setup delete button handler for each workout card
        const deleteWorkoutButton = workoutCard.querySelector('.delete-button');
        if (deleteWorkoutButton) {
            deleteWorkoutButton.addEventListener('click', () => {
                const WorkoutIndexString = deleteWorkoutButton.getAttribute('data-workout-index');
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