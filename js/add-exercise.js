// Add Exercise form: creation and reading helpers
import { esc } from './utils.js';

/**
 * Creates a form block with:
 * - Exercise name input with autocomplete from past exercises
 * - A table for sets with weight/reps inputs
 * - "Add Set" button to add more rows
 * - Difficulty dropdown (1-5 scale)
 * - Notes textarea for additional details
 * 
 * @param {Object} initial - Optional initial values for the form
 * @returns {HTMLElement} The complete form element ready to be added to the page
 */
export function createExerciseForm(initial = { name: '', notes: '', difficulty: '', sets: [] }) {
  const wrapper = document.createElement('div');
  wrapper.className = 'add-exercise-form';

  const difficultyOptions = [
    { value: '1', text: '1. Zero effort required' },
    { value: '2', text: '2. Easy' },
    { value: '3', text: '3. Challenging' },
    { value: '4', text: '4. Struggled' },
    { value: '5', text: '5. Impossible' },
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
        ${difficultyOptions.map(opt => `
          <option value="${opt.value}" ${initial.difficulty === opt.text ? 'selected' : ''}>${opt.text}</option>
        `).join('')}
      </select>
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

/**
 * Read all the exercise form blocks currently on the page and turn them
 * into structured workout data ready for saving.
 * 
 * Processes each exercise form to extract:
 * - Exercise name (required, filters out unnamed exercises)
 * - Notes (optional)
 * - Selected difficulty (if any)
 * - Sets with weight and reps (filters out empty sets)
 * 
 * @returns {Array} Filtered list of exercise objects with valid data
 */
export function readExercisesFromForms() {
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