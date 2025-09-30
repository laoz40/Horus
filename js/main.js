// import all the functions and variables we need from other files
import { SCHEMA_VERSION, loadAllExerciseNames, saveAllExerciseNames, loadAllWorkouts, saveAllWorkouts, runMigrations, WORKOUTS_KEY, populateExerciseDatalist, initNewWorkout, getCurrentWorkout } from './data-storage.js';
import { createExerciseForm, readExercisesFromForms } from './add-exercise.js';
import { updateLastWorkoutSummary, renderHistory } from './history.js';
import { showPage, wireNavButtons } from './nav.js';


// When the page is ready, wire buttons, show the home page, and set up events.
document.addEventListener('DOMContentLoaded', () => {
  showPage('workout-dashboard-page');
  wireNavButtons();

  // Start workout button
  const startWorkoutBtn = document.getElementById('start-workout-btn');
  startWorkoutBtn && startWorkoutBtn.addEventListener('click', () => {
    showPage('new-workout-page');
    initNewWorkout();
  });

  // Show current schema version in settings
  const schemaVersionEl = document.getElementById('current-schema-version');
  schemaVersionEl && (schemaVersionEl.textContent = String(SCHEMA_VERSION));

  // Add exercise form when you click "Add Exercise"
  const addExerciseBtn = document.getElementById('add-exercise-btn');
  const exerciseFormsContainer = document.getElementById('add-exercise-form');
  addExerciseBtn && addExerciseBtn.addEventListener('click', () => {
    exerciseFormsContainer && exerciseFormsContainer.appendChild(createExerciseForm());
  });
  
  // Show one empty exercise form when page loads
  exerciseFormsContainer && exerciseFormsContainer.childElementCount === 0 && exerciseFormsContainer.appendChild(createExerciseForm());

  // Back button: return to dashboard
  const backButtonWorkout = document.getElementById('workout-back-btn');
  backButtonWorkout && backButtonWorkout.addEventListener('click', (e) => {
    e.preventDefault(); // Prevent default action (form submission)
    showPage('workout-dashboard-page');
  });

  // Finish button: build the workout from the form and save it to localStorage
  const finishWorkoutBtn = document.getElementById('finish-workout-btn');
  finishWorkoutBtn && finishWorkoutBtn.addEventListener('click', () => {
    const currentWorkout = getCurrentWorkout(); // Get the current workout data
    if (!currentWorkout) { // If no workout exists, show error and stop
      alert('No active workout to save.');
      return;
    }
    const workoutNameInput = document.getElementById('workout-name');
    const workoutDateEl = document.getElementById('workout-date');
    // If the workout name or date are different, update them
    workoutNameInput && (currentWorkout.name = workoutNameInput.value.trim() || currentWorkout.name);
    workoutDateEl && (currentWorkout.date = workoutDateEl.textContent || currentWorkout.date);

    // Get exercises from forms
    currentWorkout.exercises = readExercisesFromForms();
    // If no exercises, show error and stop
    if (!currentWorkout.exercises.length) {
      alert('Add at least one exercise before finishing the workout.');
      return;
    }
    
    // Save exercise names for autocomplete
    const names = new Set(loadAllExerciseNames());
    // Add all exercise names to the set
    currentWorkout.exercises.forEach(ex => { if (ex.name) names.add(ex.name.trim()); });
    // Save the set to localStorage
    saveAllExerciseNames([...names].sort());
    populateExerciseDatalist();
    
    // Add the workout to localStorage
    const workouts = loadAllWorkouts();
    workouts.push(currentWorkout);
    saveAllWorkouts(workouts);
    
    // Update the last workout summary
    updateLastWorkoutSummary();
    // Render the history page
    renderHistory();
    // Show a success message
    alert('Workout saved!');
    // Show the history page
    showPage('history-page');
    // Reset the form
    initNewWorkout();
  });

  // Start with a fresh workout when the app opens
  initNewWorkout();
});
