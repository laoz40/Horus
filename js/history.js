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
          <div class="exercise-set">
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
  const prsSet = 2;

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
        ${workout.exercises.map(exercise => 
          buildExpandedDetailsHTML(exercise)
        ).join('')}
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
  const summary = workoutCard.querySelector('.workout-summary');
  const details = workoutCard.querySelector('.workout-details');
  
  if (summary && details) {
    // Initially hide the details
    details.style.display = 'none';
    
    // Toggle function
    const toggleDetails = (event) => {
      // Don't toggle if clicking on the delete button or its children
      if (event.target.closest('.delete-button')) {
        return;
      }
      
      // Toggle the display of the details
      if (details.style.display === 'none') {
        details.style.display = 'flex';
        workoutCard.setAttribute('aria-expanded', 'true');
      } else {
        details.style.display = 'none';
        workoutCard.setAttribute('aria-expanded', 'false');
      }
    };
    
    // Add click event listener to the summary
    summary.addEventListener('click', toggleDetails);
    
    // Add keyboard support (Enter/Space)
    summary.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleDetails(event);
      }
    });
    
    // Make the summary focusable and add ARIA attributes for accessibility
    summary.setAttribute('tabindex', '0');
    summary.setAttribute('role', 'button');
    summary.setAttribute('aria-expanded', 'false');
    summary.setAttribute('aria-controls', 'workout-details');
  }
}

// Show the latest saved workout on the dashboard
export function updateLastWorkoutSummary() {
  const summaryContainer = document.getElementById('last-workout-summary');
  if (!summaryContainer) return;
  
  const allWorkouts = loadAllWorkouts();
  const lastWorkout = allWorkouts[allWorkouts.length - 1];
  
  if (!lastWorkout) {
    summaryContainer.innerHTML = `
      <h2 class="section-header-text">Last Workout</h2>
      <p class="no-workouts-message">No workout data yet.</p>
    `;
    return;
  }
  
  summaryContainer.innerHTML = `
    <h2 class="section-header-text">Last Workout</h2>
    ${buildSummaryCardHTML(lastWorkout)}
  `;
  
  const workoutCard = summaryContainer.querySelector('.workout-summary-card');
  if (workoutCard) {
    setupWorkoutCard(workoutCard);
  }
}

// Delete a workout by index
function deleteWorkout(workoutIndex) {
  const allWorkouts = loadAllWorkouts();
  const workoutToDelete = allWorkouts[workoutIndex];
  
  if (!workoutToDelete) return;
  
  openAppModal({
    title: 'Delete workout?',
    message: `Delete workout "${workoutToDelete.name}" from ${workoutToDelete.date}? This cannot be undone.`,
    primaryText: 'Delete',
    primaryButtonClass: 'danger',
    secondaryText: 'Cancel',
    onPrimary: () => {
      const updatedWorkouts = loadAllWorkouts();
      if (!updatedWorkouts[workoutIndex]) return;
      
      updatedWorkouts.splice(workoutIndex, 1);
      saveAllWorkouts(updatedWorkouts);
      
      // Re-render the history list
      renderHistory();
      // Update the last workout summary
      updateLastWorkoutSummary();
    },
    onSecondary: () => {}
  });
}

// Render the full list of saved workouts in the History page
export function renderHistory() {
  const historyContainer = document.querySelector('.workouts-history');
  if (!historyContainer) return;
  
  // Clear existing content
  historyContainer.innerHTML = '';

  const allWorkouts = loadAllWorkouts();
  
  if (allWorkouts.length === 0) {
    historyContainer.innerHTML = `
      <div class="empty-state">
        <p class="empty-message">No workouts saved yet.</p>
      </div>
    `;
  } else {
    // Render workouts in reverse chronological order (newest first)
    historyContainer.innerHTML = allWorkouts
      .map((workout, index) => buildSummaryCardHTML(workout, index, true))
      .reverse()
      .join('');
  }
  
  // Set up event handlers for all workout cards
  historyContainer.querySelectorAll('.workout-summary-card').forEach((workoutCard, index) => {
    setupWorkoutCard(workoutCard);
    
    // Add delete button handler if present
    const deleteButton = workoutCard.querySelector('.delete-button');
    if (deleteButton) {
      deleteButton.addEventListener('click', (event) => {
        event.stopPropagation();
        const workoutIndex = parseInt(deleteButton.getAttribute('data-workout-index'), 10);
        deleteWorkout(workoutIndex);
      });
    }
  });
}
