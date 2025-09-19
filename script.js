document.addEventListener('DOMContentLoaded', () => {
    const pages = document.querySelectorAll('.page');
    const navButtons = document.querySelectorAll('nav button');

    function showPage(pageId) {
        pages.forEach(page => {
            page.classList.remove('active');
            if (page.id === pageId) {
                page.classList.add('active');
            }
        });
    }

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const pageId = button.dataset.page;
            showPage(pageId);
        });
    });

    // Show the home page by default
    showPage('home-page');

    // Button specific navigation
    const startWorkoutBtn = document.getElementById('start-workout-btn');
    if(startWorkoutBtn) {
        startWorkoutBtn.addEventListener('click', () => showPage('new-workout-page'));
    }

    const viewHistoryBtn = document.getElementById('view-history-btn');
    if(viewHistoryBtn) {
        viewHistoryBtn.addEventListener('click', () => showPage('history-page'));
    }

    const presetsBtn = document.getElementById('presets-btn');
    if(presetsBtn) {
        presetsBtn.addEventListener('click', () => showPage('presets-page'));
    }

    const viewProgressBtn = document.getElementById('view-progress-btn');
    if (viewProgressBtn) {
        viewProgressBtn.addEventListener('click', () => showPage('progress-page'));
    }

    const openPresetsFromNew = document.getElementById('open-presets-from-new');
    if (openPresetsFromNew) {
        openPresetsFromNew.addEventListener('click', () => showPage('presets-page'));
    }

    const openPresetsFromSettings = document.getElementById('open-presets-from-settings');
    if (openPresetsFromSettings) {
        openPresetsFromSettings.addEventListener('click', () => showPage('presets-page'));
    }

    // New Workout flow and storage

    const monthsShort = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const formatDisplayDate = (d) => {
        const dd = String(d.getDate());
        const mon = monthsShort[d.getMonth()];
        const yyyy = d.getFullYear();
        return `${dd} ${mon}, ${yyyy}`;
    };

    // Storage helpers
    const WORKOUTS_KEY = 'workouts';
    const EXERCISES_KEY = 'exerciseNames';
    const loadWorkouts = () => JSON.parse(localStorage.getItem(WORKOUTS_KEY) || '[]');
    const saveWorkouts = (arr) => localStorage.setItem(WORKOUTS_KEY, JSON.stringify(arr));
    const loadExerciseNames = () => JSON.parse(localStorage.getItem(EXERCISES_KEY) || '[]');
    const saveExerciseNames = (arr) => localStorage.setItem(EXERCISES_KEY, JSON.stringify(arr));
    const addExerciseName = (name) => {
        const names = new Set(loadExerciseNames());
        names.add(name.trim());
        saveExerciseNames([...names].sort());
        populateExerciseDatalist();
    };

    // Elements
    const workoutNameInput = document.getElementById('workout-name');
    const workoutDateEl = document.getElementById('workout-date');
    const addExerciseBtn = document.getElementById('add-exercise-btn');
    const finishWorkoutBtn = document.getElementById('finish-workout-btn');
    const exerciseListEl = document.getElementById('exercise-list');

    // Modal elements
    const exerciseModal = document.getElementById('exercise-modal');
    const closeExerciseModalBtn = document.getElementById('close-exercise-modal');
    const cancelExerciseBtn = document.getElementById('cancel-exercise-btn');
    const saveExerciseBtn = document.getElementById('save-exercise-btn');
    const addSetBtn = document.getElementById('add-set-btn');
    const setsTable = document.getElementById('sets-table');
    const exerciseNameInput = document.getElementById('exercise-name');
    const exerciseNotesInput = document.getElementById('exercise-notes');

    // State
    let currentWorkout = null;

    function initNewWorkout() {
        const today = new Date();
        const displayDate = formatDisplayDate(today);
        if (workoutDateEl) workoutDateEl.textContent = displayDate;
        // Default workout name: day of the week
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

    function openExerciseModal() {
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

    function closeExerciseModal() {
        if (!exerciseModal) return;
        exerciseModal.classList.remove('show');
        exerciseModal.setAttribute('aria-hidden', 'true');
    }

    // Close modal on clicking the backdrop
    if (exerciseModal) {
        const backdrop = exerciseModal.querySelector('.modal-backdrop');
        backdrop && backdrop.addEventListener('click', closeExerciseModal);
    }

    function addSetRow(defaults = { weight: '', reps: '', difficulty: '' }) {
        const row = document.createElement('div');
        row.className = 'set-row';
        row.innerHTML = `
            <input type="number" inputmode="decimal" min="0" step="0.5" placeholder="Weight" class="set-weight" value="${defaults.weight}">
            <input type="number" inputmode="numeric" min="1" step="1" placeholder="Reps" class="set-reps" value="${defaults.reps}">
            <select class="set-difficulty">
                <option value="" disabled selected>Difficulty</option>
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
            select.value = defaults.difficulty || '';
            // Apply placeholder style when blank
            const updatePlaceholderClass = () => {
                if (!select.value) select.classList.add('is-placeholder');
                else select.classList.remove('is-placeholder');
            };
            updatePlaceholderClass();
            select.addEventListener('change', updatePlaceholderClass);
        }
        row.querySelector('.remove-set').addEventListener('click', () => {
            const ok = confirm('Delete this set?');
            if (ok) row.remove();
        });
        setsTable.appendChild(row);
    }

    function readSetsFromTable() {
        const rows = [...setsTable.querySelectorAll('.set-row')];
        return rows
            .map((row) => {
                const diffRaw = row.querySelector('.set-difficulty').value;
                const difficulty = diffRaw ? parseInt(diffRaw, 10) : null;
                return {
                    weight: parseFloat(row.querySelector('.set-weight').value || '0'),
                    reps: parseInt(row.querySelector('.set-reps').value || '0', 10),
                    difficulty,
                };
            })
            .filter(s => s.reps > 0);
    }

    function renderExerciseList() {
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
                    <strong>${ex.name}</strong>
                    <span class="muted">${totalSets} set${totalSets !== 1 ? 's' : ''}</span>
                </div>
                <div class="accordion-details" hidden>
                    ${ex.notes ? `<div class="muted">Notes: ${ex.notes}</div>` : ''}
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
                    <strong>${last.name}</strong>
                    <span class="muted">${last.date}</span>
                    <span class="muted">${last.exercises.length} exercises, ${totalSets} sets</span>
                </div>
                <div class="history-details" hidden>
                    ${last.exercises
                        .map(ex => `
                            <div class="history-ex">
                                <strong>${ex.name}</strong>
                                ${ex.notes ? `<div class="muted">Notes: ${ex.notes}</div>` : ''}
                                ${ex.sets
                                    .map((s, i) => `<div class="set-line"><span class="label">Set ${i + 1}:</span> <span>${s.weight} kg × ${s.reps}</span> ${s.difficulty != null ? `<span class="label">Difficulty:</span> <span>${s.difficulty}</span>` : ''}</div>`)
                                    .join('')}
                            </div>
                        `)
                        .join('')}
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
                                <strong>${w.name}</strong>
                                <span class="muted">${w.date}</span>
                                <span class="muted">${w.exercises.length} exercises, ${totalSets} sets</span>
                                <button type="button" class="icon-btn danger delete-workout" data-index="${wi}">Delete</button>
                            </div>
                            <div class="history-details" hidden>
                                ${w.exercises
                                    .map(ex => `
                                        <div class="history-ex">
                                            <strong>${ex.name}</strong>
                                            ${ex.notes ? `<div class=\"muted\">Notes: ${ex.notes}</div>` : ''}
                                            ${ex.sets
                                                .map((s, i) => `<div class=\"set-line\"><span class=\"label\">Set ${i + 1}:</span> <span>${s.weight} kg × ${s.reps}</span> ${s.difficulty != null ? `<span class=\"label\">Difficulty:</span> <span>${s.difficulty}</span>` : ''}</div>`)
                                                .join('')}
                                        </div>
                                    `)
                                    .join('')}
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
        // Delete handlers
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
                renderHistory();
                updateLastWorkoutSummary();
            });
        });
    }

    // Event bindings
    addExerciseBtn && addExerciseBtn.addEventListener('click', openExerciseModal);
    closeExerciseModalBtn && closeExerciseModalBtn.addEventListener('click', closeExerciseModal);
    cancelExerciseBtn && cancelExerciseBtn.addEventListener('click', closeExerciseModal);
    addSetBtn && addSetBtn.addEventListener('click', () => addSetRow());

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
        addExerciseName(name);
        renderExerciseList();
        closeExerciseModal();
    });

    finishWorkoutBtn && finishWorkoutBtn.addEventListener('click', () => {
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

    // Initialize on page load
    initNewWorkout();
});