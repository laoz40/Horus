// Gym Tracker – main script
// This file controls page navigation, data storage (localStorage),
// and rendering of workouts (current, last, and history).

// Global constants and helpers (defined once)
/** Short month names used to format dates for display */
const monthsShort = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
/** Day names to create a friendly default workout name (e.g., "Saturday") */
const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

/**
 * Convert a Date object into a friendly string like "20 Sep, 2025".
 * @param {Date} d - the date to format
 * @returns {string}
 */
const formatDisplayDate = (d) => {
    const dd = String(d.getDate());
    const mon = monthsShort[d.getMonth()];
    const yyyy = d.getFullYear();
    return `${dd} ${mon}, ${yyyy}`;
};

// LocalStorage keys and simple storage helpers
/** Key used to store the array of workouts in localStorage */
const WORKOUTS_KEY = 'workouts';
/** Key used to store the list of exercise names (for suggestions) */
const EXERCISES_KEY = 'exerciseNames';
/** Load all saved workouts from localStorage */
const loadWorkouts = () => JSON.parse(localStorage.getItem(WORKOUTS_KEY) || '[]');
/** Save all workouts back to localStorage */
const saveWorkouts = (arr) => localStorage.setItem(WORKOUTS_KEY, JSON.stringify(arr));
/** Load saved exercise names (used for the datalist suggestions) */
const loadExerciseNames = () => JSON.parse(localStorage.getItem(EXERCISES_KEY) || '[]');
/** Save exercise names (kept unique and sorted) */
const saveExerciseNames = (arr) => localStorage.setItem(EXERCISES_KEY, JSON.stringify(arr));

/**
 * Escape user-provided text so it is safe to insert into innerHTML strings.
 * This prevents breaking the HTML and helps avoid XSS issues.
 * @param {string} s
 * @returns {string}
 */
const esc = (s) => String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/**
 * Build the repeated HTML for a workout's exercises and sets.
 * Keeping this in one function avoids duplicate code in different screens.
 * @param {{exercises: Array<{name:string, notes?:string, sets:Array<{weight:number,reps:number,difficulty:number|null}>}>}} workout
 * @returns {string}
 */
function workoutDetailsHTML(workout) {
    return workout.exercises
        .map(ex => `
            <div class="history-ex">
                <strong>${esc(ex.name)}</strong>
                ${ex.notes ? `<div class="muted">Notes: ${esc(ex.notes)}</div>` : ''}
                ${ex.sets
                    .map((s, i) => `
                        <div class="set-line">
                            <span class="label">Set ${i + 1}:</span>
                            <span>${s.weight} kg × ${s.reps}</span>
                            ${s.difficulty != null ? `<span class="label">Difficulty:</span> <span>${s.difficulty}</span>` : ''}
                        </div>
                    `)
                    .join('')}
            </div>
        `)
        .join('');
}

/** Main entry point – waits for the HTML to be ready before running code */
document.addEventListener('DOMContentLoaded', () => {
    /** All app pages (Home, New Workout, History, etc.) */
    const pages = document.querySelectorAll('.page');
    /** Header nav buttons that switch pages */
    const navButtons = document.querySelectorAll('nav button');

    /**
     * Show exactly one page by ID and hide the others.
     * Also re-renders that page's content so it's always fresh.
     * @param {string} pageId - the id attribute of the page section to show
     */
    function showPage(pageId) {
        pages.forEach(page => {
            page.classList.toggle('active', page.id === pageId);
        });
        // Render on demand so each page is fresh when opened
        if (pageId === 'history-page') {
            renderHistory();
        } else if (pageId === 'home-page') {
            updateLastWorkoutSummary();
        } else if (pageId === 'new-workout-page') {
            renderExerciseList();
        }
    }

    // Wire header nav buttons to change the visible page
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const pageId = button.dataset.page;
            showPage(pageId);
        });
    });

    // Show the home page by default on load
    showPage('home-page');

    // Button specific navigation shortcuts
    const startWorkoutBtn = document.getElementById('start-workout-btn');
    if(startWorkoutBtn) {
        startWorkoutBtn.addEventListener('click', () => showPage('new-workout-page'));
    }

    const viewHistoryBtn = document.getElementById('view-history-btn');
    if(viewHistoryBtn) {
        viewHistoryBtn.addEventListener('click', () => showPage('history-page'));
    }

    const viewProgressBtn = document.getElementById('view-progress-btn');
    if (viewProgressBtn) {
        viewProgressBtn.addEventListener('click', () => showPage('progress-page'));
    }

    // New Workout flow and storage

    /** Current workout object held in memory until saved */
    let currentWorkout = null;

    /**
     * Start a fresh workout with today's date and the weekday as the default name.
     * Initializes lists and summaries so the UI is ready to use.
     */
    function initNewWorkout() {
        const today = new Date();
        const displayDate = formatDisplayDate(today);
        const workoutDateEl = document.getElementById('workout-date');
        const workoutNameInput = document.getElementById('workout-name');
        const exerciseListEl = document.getElementById('exercise-list');
        if (workoutDateEl) workoutDateEl.textContent = displayDate;
        // Default workout name: day of the week (e.g., "Saturday")
        const dayName = weekdays[today.getDay()];
        if (workoutNameInput) workoutNameInput.value = dayName;
        currentWorkout = {
            id: `${Date.now()}`,
            name: workoutNameInput ? workoutNameInput.value.trim() : dayName,
            date: workoutDateEl ? workoutDateEl.textContent : displayDate,
            exercises: []
        };
        renderExerciseList();
        populateExerciseDatalist();
        updateLastWorkoutSummary();
    }

    /** Open the Add Exercise modal and pre-fill with 3 blank set rows */
    function openExerciseModal() {
        const exerciseModal = document.getElementById('exercise-modal');
        const exerciseNameInput = document.getElementById('exercise-name');
        const exerciseNotesInput = document.getElementById('exercise-notes');
        const setsTable = document.getElementById('sets-table');
        if (!exerciseModal) return;
        exerciseNameInput.value = '';
        exerciseNotesInput.value = '';
        setsTable.innerHTML = '';
        // Default to 3 set rows
        addSetRow();
        addSetRow();
        addSetRow();
        exerciseModal.classList.add('show');
        exerciseModal.setAttribute('aria-hidden', 'false');
        exerciseNameInput.focus();
    }

    /** Close the Add Exercise modal */
    function closeExerciseModal() {
        const exerciseModal = document.getElementById('exercise-modal');
        if (!exerciseModal) return;
        exerciseModal.classList.remove('show');
        exerciseModal.setAttribute('aria-hidden', 'true');
    }

    // Close modal on backdrop click, outside-click (on modal container), or Escape
    (function attachModalDismissals(){
        const exerciseModal = document.getElementById('exercise-modal');
        if (!exerciseModal) return;
        // Close when clicking backdrop or the modal container outside the content
        exerciseModal.addEventListener('click', (e) => {
            if (e.target === exerciseModal || e.target.classList.contains('modal-backdrop')) {
                closeExerciseModal();
            }
        });
    })();

    /**
     * Add one Set row into the modal (Weight, Reps, Difficulty, and an X button).
     * @param {{weight:string|number, reps:string|number, difficulty:string|number}} defaults
     */
    function addSetRow(defaults = { weight: '', reps: '', difficulty: '' }) {
        const setsTable = document.getElementById('sets-table');
        const row = document.createElement('div');
        row.className = 'set-row';
        row.innerHTML = `
            <input type="number" inputmode="decimal" min="0" step="0.5" placeholder="Weight" class="set-weight" value="${defaults.weight}">
            <input type="number" inputmode="numeric" min="1" step="1" placeholder="Reps" class="set-reps" value="${defaults.reps}">
            <select class="set-difficulty" required>
                <option value="" disabled hidden>Difficulty</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
            </select>
            <button type="button" class="icon-btn remove-set" aria-label="Remove set">✕</button>
        `;
        const select = row.querySelector('.set-difficulty');
        if (select) {
            // Set default selection if provided; otherwise remains invalid (placeholder shown)
            select.value = defaults.difficulty || '';
        }
        row.querySelector('.remove-set').addEventListener('click', () => {
            const ok = confirm('Delete this set?');
            if (ok) row.remove();
        });
        setsTable.appendChild(row);
    }

    /**
     * Read all Set rows from the modal and turn them into data objects.
     * Empties and zero-rep rows are filtered out.
     * @returns {Array<{weight:number, reps:number, difficulty:number|null}>}
     */
    function readSetsFromTable() {
        const setsTable = document.getElementById('sets-table');
        const rows = [...setsTable.querySelectorAll('.set-row')];
        return rows
            .map((row) => {
                // Cache inputs once per row to avoid repeated DOM queries
                const weightEl = row.querySelector('.set-weight');
                const repsEl = row.querySelector('.set-reps');
                const diffEl = row.querySelector('.set-difficulty');

                const weight = parseFloat((weightEl && weightEl.value) || '0');
                const reps = parseInt((repsEl && repsEl.value) || '0', 10);
                const diffRaw = diffEl ? diffEl.value : '';
                const difficulty = diffRaw ? parseInt(diffRaw, 10) : null;

                return { weight, reps, difficulty };
            })
            .filter(s => s.reps > 0);
    }

    /** Render the current workout's exercises list (accordion) */
    function renderExerciseList() {
        const exerciseListEl = document.getElementById('exercise-list');
        if (!exerciseListEl) return;
        exerciseListEl.innerHTML = '';
        if (!currentWorkout || currentWorkout.exercises.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'muted';
            empty.textContent = 'No exercises added yet.';
            exerciseListEl.appendChild(empty);
            return;
        }
        currentWorkout.exercises.forEach((ex, idx) => {
            const item = document.createElement('div');
            item.className = 'accordion-item';
            const totalSets = ex.sets.length;
            item.innerHTML = `
                <div class="accordion-summary">
                    <strong>${esc(ex.name)}</strong>
                    <span class="muted">${totalSets} set${totalSets !== 1 ? 's' : ''}</span>
                </div>
                <div class="accordion-details" hidden>
                    ${ex.notes ? `<div class="muted">Notes: ${esc(ex.notes)}</div>` : ''}
                    ${ex.sets
                        .map((s, i) => `
                            <div class="set-line">
                                <span class="label">Set ${i + 1}:</span>
                                <span>${s.weight} kg × ${s.reps} reps</span>
                                ${s.difficulty != null ? `<span class="label">Difficulty:</span> <span>${s.difficulty}</span>` : ''}
                            </div>
                        `)
                        .join('')}
                </div>
            `;
            const summary = item.querySelector('.accordion-summary');
            const details = item.querySelector('.accordion-details');
            summary.addEventListener('click', () => {
                const hidden = details.hasAttribute('hidden');
                document.querySelectorAll('#exercise-list .accordion-details').forEach(d => d.setAttribute('hidden', ''));
                if (hidden) details.removeAttribute('hidden');
            });
            exerciseListEl.appendChild(item);
        });
    }

    /** Fill the datalist suggestions for exercise names from saved names */
    function populateExerciseDatalist() {
        const list = document.getElementById('exercise-name-list');
        if (!list) return;
        list.innerHTML = '';
        loadExerciseNames().forEach(name => {
            const opt = document.createElement('option');
            opt.value = name;
            list.appendChild(opt);
        });
    }

    /** Render the "Last Workout" card on the Home page */
    function updateLastWorkoutSummary() {
        const summaryEl = document.getElementById('last-workout-summary');
        if (!summaryEl) return;
        const workouts = loadWorkouts();
        const last = workouts[workouts.length - 1];
        if (!last) {
            summaryEl.innerHTML = '<h3>Last Workout</h3><p>No workout data yet.</p>';
            return;
        }
        const totalSets = last.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
        summaryEl.innerHTML = `
            <h3>Last Workout</h3>
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
     * Render the full workout history list.
     * Each item can expand to show exercises/sets and can be deleted.
     */
    function renderHistory() {
        const historySection = document.getElementById('history-page');
        if (!historySection) return;
        // Clear old list
        historySection.querySelectorAll('.history-list').forEach(n => n.remove());
        const list = document.createElement('div');
        list.className = 'history-list card';
        const workouts = loadWorkouts();
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
                                <button type="button" class="icon-btn danger delete-workout" data-index="${wi}">Delete</button>
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
        // Expand/collapse per item independently
        list.querySelectorAll('.history-item').forEach((item) => {
            const summary = item.querySelector('.history-summary');
            const details = item.querySelector('.history-details');
            summary.addEventListener('click', () => {
                if (details.hasAttribute('hidden')) details.removeAttribute('hidden');
                else details.setAttribute('hidden', '');
            });
        });
        // Delete handlers (optimize: remove only the clicked item)
        list.querySelectorAll('.delete-workout').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.getAttribute('data-index'), 10);
                const workouts = loadWorkouts();
                const w = workouts[idx];
                if (!w) return;
                const ok = confirm(`Delete workout "${w.name}" on ${w.date}? This cannot be undone.`);
                if (!ok) return;
                workouts.splice(idx, 1);
                saveWorkouts(workouts);
                const itemEl = btn.closest('.history-item');
                if (itemEl) itemEl.remove();
                if (!list.querySelector('.history-item')) {
                    list.innerHTML = '<p class="muted">No workouts saved yet.</p>';
                }
                updateLastWorkoutSummary();
            });
        });
    }

    // --- Event bindings for the Add Exercise modal and saving ---
    const addExerciseBtn = document.getElementById('add-exercise-btn');
    const closeExerciseModalBtn = document.getElementById('close-exercise-modal');
    const cancelExerciseBtn = document.getElementById('cancel-exercise-btn');
    const saveExerciseBtn = document.getElementById('save-exercise-btn');
    const addSetBtn = document.getElementById('add-set-btn');

    // Open/close modal buttons
    addExerciseBtn && addExerciseBtn.addEventListener('click', openExerciseModal);
    closeExerciseModalBtn && closeExerciseModalBtn.addEventListener('click', closeExerciseModal);
    cancelExerciseBtn && cancelExerciseBtn.addEventListener('click', closeExerciseModal);

    // Add a new (blank) set row into the table
    addSetBtn && addSetBtn.addEventListener('click', () => addSetRow());

    // Save exercise into the current workout
    const exerciseNameInput = document.getElementById('exercise-name');
    const exerciseNotesInput = document.getElementById('exercise-notes');
    const setsTable = document.getElementById('sets-table');
    const finishWorkoutBtn = document.getElementById('finish-workout-btn');

    saveExerciseBtn && saveExerciseBtn.addEventListener('click', () => {
        const name = exerciseNameInput.value.trim();
        if (!name) {
            exerciseNameInput.focus();
            return;
        }
        const sets = readSetsFromTable();
        if (sets.length === 0) {
            addSetRow();
            return;
        }
        const exNotes = exerciseNotesInput ? exerciseNotesInput.value.trim() : '';
        currentWorkout.exercises.push({ name, notes: exNotes, sets });
        // Save name to suggestions list
        const names = new Set(loadExerciseNames());
        names.add(name.trim());
        saveExerciseNames([...names].sort());
        populateExerciseDatalist();
        renderExerciseList();
        closeExerciseModal();
    });

    // Finish and save the workout to localStorage
    finishWorkoutBtn && finishWorkoutBtn.addEventListener('click', () => {
        const workoutNameInput = document.getElementById('workout-name');
        const workoutDateEl = document.getElementById('workout-date');
        // Sync name/date in case user edited
        if (workoutNameInput) currentWorkout.name = workoutNameInput.value.trim() || currentWorkout.name;
        if (workoutDateEl) currentWorkout.date = workoutDateEl.textContent || currentWorkout.date;
        if (!currentWorkout.exercises.length) {
            alert('Add at least one exercise before finishing the workout.');
            return;
        }
        const workouts = loadWorkouts();
        workouts.push(currentWorkout);
        saveWorkouts(workouts);
        updateLastWorkoutSummary();
        renderHistory();
        alert('Workout saved!');
        // Start a fresh workout
        initNewWorkout();
    });

    // Initialize a fresh workout when the app loads
    initNewWorkout();
});