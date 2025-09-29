// Gym Tracker – main script
// This file controls page navigation, data storage (localStorage),
// and rendering of workouts (current, last, and history).

/** Short month names used to format dates for display */
const monthsShort = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
/** Day names to create a friendly default workout name (e.g., "Saturday") */
const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

/**
 * Current data schema version for workouts saved to localStorage.
 * Each time we change the structure/meaning of the stored data, bump this.
 * New workouts are stamped with this number so we can tell which version
 * they were created under and migrate older ones forward automatically.
 */
const SCHEMA_VERSION = 2;

/**
 * Helper that translates a numeric difficulty from old data (v1)
 * into the new labeled string used in v2. Returns null if unknown.
 */
function mapDifficultyNumberToLabel(n) {
    const map = {
        1: '1. Zero effort required',
        2: '2. Easy',
        3: '3. Challenging',
        4: '4. Struggled',
        5: '5. Impossible'
    };
    return map[n] || null;
}

/**
 * Format difficulty labels for display in history.
 */
function toDifficultyDisplay(label) {
    if (label == null) return '';
    const m = String(label).match(/^\s*\d+\.\s*(.+)$/);
    return m ? m[1] : String(label);
}

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
/**
 * Load all saved workouts from localStorage and ensure they match the
 * current schema by running them through our migration pipeline.
 * If migrations make changes, the updated data will be persisted.
 */
const loadAllWorkouts = () => {
    const raw = JSON.parse(localStorage.getItem(WORKOUTS_KEY) || '[]');
    return runMigrations(raw);
};
/** Save all workouts back to localStorage */
const saveAllWorkouts = (arr) => localStorage.setItem(WORKOUTS_KEY, JSON.stringify(arr));
/** Load saved exercise names (used for the datalist suggestions) */
const loadAllExerciseNames = () => JSON.parse(localStorage.getItem(EXERCISES_KEY) || '[]');
/** Save exercise names (kept unique and sorted) */
const saveAllExerciseNames = (arr) => localStorage.setItem(EXERCISES_KEY, JSON.stringify(arr));

// --- Schema migration system ---
// We define small, forward-only steps that convert data from version N -> N+1.
// When loading, we detect each workout's version and apply missing steps
// until it reaches SCHEMA_VERSION.
const MIGRATIONS = {
    /**
     * Upgrade a workout from v1 to v2.
     * - difficulty used to be numeric (optionally per-set); now it's a labeled string on the exercise
     * - we choose the highest per-set difficulty (if present) and set it on the exercise
     * - per-set difficulty fields are removed
     * - schemaVersion is set to 2
     * @param {object} w - a workout object in schema v1
     * @returns {object} - the upgraded workout in schema v2
     */
    1: (w) => {
        if (!w || typeof w !== 'object') return w;
        const newW = { ...w };
        newW.schemaVersion = 2;
        if (!Array.isArray(newW.exercises)) return newW;
        newW.exercises = newW.exercises.map((ex) => {
            const newEx = { ...ex };
            // Promote per-set difficulty -> exercise.difficulty (take max across sets)
            let promoted = null;
            if (Array.isArray(newEx.sets)) {
                let maxDiff = null;
                newEx.sets = newEx.sets.map((s) => {
                    const ns = { ...s };
                    if (ns && typeof ns.difficulty !== 'undefined' && ns.difficulty !== null) {
                        const num = Number(ns.difficulty);
                        if (!Number.isNaN(num)) {
                            maxDiff = (maxDiff == null) ? num : Math.max(maxDiff, num);
                        }
                    }
                    // Remove per-set difficulty in v2
                    if ('difficulty' in ns) delete ns.difficulty;
                    return ns;
                });
                if (maxDiff != null) promoted = mapDifficultyNumberToLabel(maxDiff);
            }
            // Normalize exercise-level difficulty
            if (newEx.difficulty == null && promoted) {
                newEx.difficulty = promoted;
            } else if (typeof newEx.difficulty === 'number') {
                newEx.difficulty = mapDifficultyNumberToLabel(newEx.difficulty);
            }
            return newEx;
        });
        return newW;
    }
};

/**
 * Apply all missing migrations to each workout in the given array.
 * - Figures out the source version (defaults to 1 if missing)
 * - Sequentially applies MIGRATIONS[v] for v ..< SCHEMA_VERSION
 * - If any item changes, we write the upgraded array back to storage
 * @param {Array<object>} workouts
 * @returns {Array<object>} the data, possibly upgraded to the latest schema
 */
function runMigrations(workouts) {
    let changed = false;
    const upgraded = workouts.map((w) => {
        const from = (w && typeof w === 'object' && 'schemaVersion' in w) ? (w.schemaVersion || 1) : 1;
        let curr = { ...w };
        for (let v = from; v < SCHEMA_VERSION; v++) {
            const migrate = MIGRATIONS[v];
            if (typeof migrate === 'function') {
                const next = migrate(curr) || curr;
                if (next !== curr) changed = true;
                curr = next;
            }
        }
        return curr;
    });
    if (changed) {
        // Only persist if something actually changed
        saveAllWorkouts(upgraded);
        return upgraded;
    }
    return workouts;
}

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
        } else if (pageId === 'workout-dashboard-page') {
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
    showPage('workout-dashboard-page');

    // Button specific navigation shortcuts
    const startWorkoutBtn = document.getElementById('start-workout-btn');
    if(startWorkoutBtn) {
        startWorkoutBtn.addEventListener('click', () => showPage('new-workout-page'));
    }

    // Settings section: show the current schema version and let users
    // manually re-run migrations (useful after importing older data
    // or while developing migration logic). Normally migrations run
    // automatically on page load via loadAllWorkouts().
    const schemaVersionEl = document.getElementById('current-schema-version');
    if (schemaVersionEl) schemaVersionEl.textContent = String(SCHEMA_VERSION);
    const rerunBtn = document.getElementById('rerun-migrations-btn');
    if (rerunBtn) {
        rerunBtn.addEventListener('click', () => {
            // Load raw array (bypass auto-upgrade) and force-run migrations now
            const raw = JSON.parse(localStorage.getItem(WORKOUTS_KEY) || '[]');
            const migrated = runMigrations(raw);
            // If runMigrations persisted changes, migrated may differ
            // Update UI summaries either way
            updateLastWorkoutSummary();
            renderHistory();
            alert('Migrations completed.');
        });
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
            schemaVersion: SCHEMA_VERSION,
            name: workoutNameInput ? workoutNameInput.value.trim() : dayName,
            date: workoutDateEl ? workoutDateEl.textContent : displayDate,
            exercises: []
        };
        // Reset inline exercise forms to a fresh single form
        const exerciseFormsContainer = document.getElementById('add-exercise-form');
        if (exerciseFormsContainer) {
            exerciseFormsContainer.innerHTML = '';
            exerciseFormsContainer.appendChild(createExerciseForm());
        }
        renderExerciseList();
        populateExerciseDatalist();
        updateLastWorkoutSummary();
    }

    // Build an inline exercise form (name, sets table with per-form Add Set, difficulty, notes)
    function createExerciseForm(initial = { name: '', notes: '', difficulty: '', sets: [] }) {
        const wrapper = document.createElement('div');
        wrapper.className = 'add-exercise-form';
        
        // Define difficulty options with their values and display text
        const difficultyOptions = [
            {value: "1", text: "1. Zero effort required"},
            {value: "2", text: "2. Easy"},
            {value: "3", text: "3. Challenging"},
            {value: "4", text: "4. Struggled"},
            {value: "5", text: "5. Impossible"}
        ];

        wrapper.innerHTML = `
            <div class="exercise-text-container">
                <input list="exercise-name-list" class="exercise-name" placeholder="Exercise Name" autocomplete="off" required value="${esc(initial.name)}">
            </div>
            <div class="sets-container">
                <div class="sets-table"></div>
                <button type="button" class="secondary add-set">Add Set</button>
            </div>
            <div class="exercise-text-container">
                <select class="exercise-difficulty" required>
                    <option value="" disabled ${!initial.difficulty ? 'selected' : ''} hidden>Difficulty</option>
                    ${difficultyOptions.map(opt => 
                        `<option value="${opt.value}" ${initial.difficulty === opt.text ? 'selected' : ''}>${opt.text}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="exercise-text-container">
                <textarea class="exercise-notes" rows="1" placeholder="Add a note">${initial.notes ? esc(initial.notes) : ''}</textarea>
            </div>
        `;

        const setsTable = wrapper.querySelector('.sets-table');
        const addSetBtn = wrapper.querySelector('.add-set');

        function addSetRowTo(tableEl, setNumber, defaults = { weight: '', reps: '' }) {
            const row = document.createElement('div');
            row.className = 'set-row';
            if (!setNumber) {
                setNumber = tableEl.querySelectorAll('.set-row').length + 1;
            }
            row.innerHTML = `
                <span class="set-number" aria-label="Set ${setNumber}">${setNumber}</span>
                <input type="number" inputmode="decimal" min="0" step="0.5" placeholder="Weight" class="set-weight" value="${defaults.weight}">
                <input type="number" inputmode="numeric" min="1" step="1" placeholder="Reps" class="set-reps" value="${defaults.reps}">
                <button type="button" class="x-delete-btn remove-set" aria-label="Remove set">✕</button>
            `;
            row.querySelector('.remove-set').addEventListener('click', () => {
                row.remove();
                tableEl.querySelectorAll('.set-row').forEach((r, idx) => {
                    const num = r.querySelector('.set-number');
                    num.textContent = String(idx + 1);
                    num.setAttribute('aria-label', `Set ${idx + 1}`);
                });
            });
            tableEl.appendChild(row);
        }

        if (initial.sets && initial.sets.length) {
            initial.sets.forEach((s, i) => addSetRowTo(setsTable, i + 1, { weight: s.weight, reps: s.reps }));
        } else {
            addSetRowTo(setsTable, 1);
        }

        addSetBtn.addEventListener('click', () => addSetRowTo(setsTable));

        return wrapper;
    }

    // Gather all exercises from inline forms on the New Workout page
    function readExercisesFromForms() {
        const container = document.getElementById('add-exercise-form');
        if (!container) return [];
        const forms = [...container.querySelectorAll('.add-exercise-form')];
        return forms.map(form => {
            const name = (form.querySelector('.exercise-name')?.value || '').trim();
            const notes = (form.querySelector('.exercise-notes')?.value || '').trim();
            const diffSelect = form.querySelector('.exercise-difficulty');
            const difficulty = diffSelect?.value ? diffSelect.options[diffSelect.selectedIndex].text : null;
            const sets = [...form.querySelectorAll('.set-row')]
                .map(row => {
                    const weight = parseFloat((row.querySelector('.set-weight')?.value || '0'));
                    const reps = parseInt((row.querySelector('.set-reps')?.value || '0'), 10);
                    return { weight, reps };
                })
                .filter(s => s.reps > 0);
            return { name, notes, difficulty, sets };
        }).filter(ex => ex.name && ex.sets.length > 0);
    }

    /** Render list is unused in inline-forms flow */
    function renderExerciseList() { return; }

    /** Fill the datalist suggestions for exercise names from saved names */
    function populateExerciseDatalist() {
        const list = document.getElementById('exercise-name-list');
        if (!list) return;
        list.innerHTML = '';
        loadAllExerciseNames().forEach(name => {
            const opt = document.createElement('option');
            opt.value = name;
            list.appendChild(opt);
        });
    }

    /** Render the "Last Workout" card on the Home page */
    function updateLastWorkoutSummary() {
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
     * Render the full workout history list.
     * Each item can expand to show exercises/sets and can be deleted.
     */
    function renderHistory() {
        const historySection = document.getElementById('history-page');
        if (!historySection) return;
        // Clear old list
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

    // --- Event bindings for the Add Exercise button ---
    const addExerciseBtn = document.getElementById('add-exercise-btn');

    // Add a new inline exercise form
    const exerciseFormsContainer = document.getElementById('add-exercise-form');
    addExerciseBtn && addExerciseBtn.addEventListener('click', () => {
        if (!exerciseFormsContainer) return;
        exerciseFormsContainer.appendChild(createExerciseForm());
    });

    // Initial inline form to start with
    if (exerciseFormsContainer && exerciseFormsContainer.childElementCount === 0) {
        exerciseFormsContainer.appendChild(createExerciseForm());
    }

    // Save exercise into the current workout now happens on Finish; no per-exercise save button
    const finishWorkoutBtn = document.getElementById('finish-workout-btn');

    // Finish and save the workout to localStorage
    finishWorkoutBtn && finishWorkoutBtn.addEventListener('click', () => {
        const workoutNameInput = document.getElementById('workout-name');
        const workoutDateEl = document.getElementById('workout-date');
        // Sync name/date in case user edited
        if (workoutNameInput) currentWorkout.name = workoutNameInput.value.trim() || currentWorkout.name;
        if (workoutDateEl) currentWorkout.date = workoutDateEl.textContent || currentWorkout.date;
        // Build exercises from inline forms before saving
        currentWorkout.exercises = readExercisesFromForms();
        if (!currentWorkout.exercises.length) {
            alert('Add at least one exercise before finishing the workout.');
            return;
        }
        // Update suggestions list with any new exercise names
        const names = new Set(loadAllExerciseNames());
        currentWorkout.exercises.forEach(ex => { if (ex.name) names.add(ex.name.trim()); });
        saveAllExerciseNames([...names].sort());
        populateExerciseDatalist();
        const workouts = loadAllWorkouts();
        workouts.push(currentWorkout);
        saveAllWorkouts(workouts);
        updateLastWorkoutSummary();
        renderHistory();
        alert('Workout saved!');
        // Start a fresh workout
        initNewWorkout();
    });

    // Initialize a fresh workout when the app loads
    initNewWorkout();
});