// History rendering and summaries
import { esc } from './utils.js';
import { loadAllWorkouts, saveAllWorkouts, toDifficultyDisplay } from './data-storage.js';

/**
 * Build the HTML that shows a workout's exercises and sets.
 * Used by the history views and the last workout summary.
 */
export function workoutDetailsHTML(workout) {
  return workout.exercises
    .map(ex => `
      <div class="history-exercise-item">
        <strong>${esc(ex.name)}</strong>
        ${ex.sets
          .map((s, i) => `
            <div class="set-line">
              <span class="muted">${i + 1}</span>
              <span>${s.weight} kg × ${s.reps}</span>
            </div>
          `)
          .join('')}
          ${ex.difficulty ? `<span class="muted">Difficulty:</span> <span>${esc(toDifficultyDisplay(ex.difficulty))}</span>` : ''}
          ${ex.notes ? `<span class="muted">Note:</span> <span>${esc(ex.notes)}</span>` : ''}
      </div>
    `)
    .join('');
}

/**
 * Show the latest saved workout on the dashboard (home page).
 * Lets you click to expand/collapse more details.
 */
export function updateLastWorkoutSummary() {
  const summaryEl = document.getElementById('last-workout-summary');
  if (!summaryEl) return;
  const workouts = loadAllWorkouts();
  const last = workouts[workouts.length - 1];
  if (!last) {
    summaryEl.innerHTML = '<h2 class="section-header-text">Last Workout</h2><p>No workout data yet.</p>';
    return;
  }
  const totalSets = last.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  summaryEl.innerHTML = `
    <h2 class="section-header-text">Last Workout</h2>
    <div class="history-item">
      <div class="history-summary">
        <strong>${esc(last.name)}</strong>
        <span class="muted">${esc(last.date)}</span>
        <span class="muted">${last.exercises.length} exercises, ${totalSets} sets</span>
      </div>
      <div class="history-details" hidden>
        ${workoutDetailsHTML(last)}
      </div>
    </div>
  `;
  const item = summaryEl.querySelector('.history-item');
  const summary = item.querySelector('.history-summary');
  const details = item.querySelector('.history-details');
  summary.addEventListener('click', () => {
    if (details.hasAttribute('hidden')) details.removeAttribute('hidden');
    else details.setAttribute('hidden', '');
  });
}

/**
 * Render the full list of saved workouts in the History page.
 * Supports expanding items to see details and deleting workouts.
 */
export function renderHistory() {
  const historySection = document.getElementById('history-page');
  if (!historySection) return;
  historySection.querySelectorAll('.history-list').forEach(n => n.remove());
  const list = document.createElement('div');
  list.className = 'history-list';
  const workouts = loadAllWorkouts();
  if (workouts.length === 0) {
    list.innerHTML = '<p class="muted">No workouts saved yet.</p>';
  } else {
    list.innerHTML = workouts
      .map((w, wi) => {
        const totalSets = w.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
        return `
          <div class="history-item">
            <div class="history-summary">
              <strong>${esc(w.name)}</strong>
              <span class="muted">${esc(w.date)}</span>
              <span class="muted">${w.exercises.length} exercises, ${totalSets} sets</span>
              <button type="button" class="x-delete-btn danger delete-workout" data-index="${wi}">✕</button>
            </div>
            <div class="history-details" hidden>
              ${workoutDetailsHTML(w)}
            </div>
          </div>
        `;
      })
      .join('');
  }
  historySection.appendChild(list);
  list.querySelectorAll('.history-item').forEach((item) => {
    const summary = item.querySelector('.history-summary');
    const details = item.querySelector('.history-details');
    summary.addEventListener('click', () => {
      if (details.hasAttribute('hidden')) details.removeAttribute('hidden');
      else details.setAttribute('hidden', '');
    });
  });
  list.querySelectorAll('.delete-workout').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.getAttribute('data-index'), 10);
      const workouts = loadAllWorkouts();
      const w = workouts[idx];
      if (!w) return;
      const ok = confirm(`Delete workout "${w.name}" on ${w.date}? This cannot be undone.`);
      if (!ok) return;
      workouts.splice(idx, 1);
      saveAllWorkouts(workouts);
      const itemEl = btn.closest('.history-item');
      if (itemEl) itemEl.remove();
      if (!list.querySelector('.history-item')) {
        list.innerHTML = '<p class="muted">No workouts saved yet.</p>';
      }
      updateLastWorkoutSummary();
    });
  });
}
