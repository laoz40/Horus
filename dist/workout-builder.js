// import all the functions and variables we need from other files
import { esc } from './utils.js';
import { openAppModal } from './modal.js';
// Creates an exercise form
export function createExerciseForm(initial = { name: '', notes: '', difficulty: '', sets: [] }) {
    const exerciseFormContainer = document.createElement('div');
    exerciseFormContainer.className = 'add-exercise-form';
    // map difficulty values to labels
    const difficultyOptions = [
        { value: '1', text: '1. Zero effort' },
        { value: '2', text: '2. Easy' },
        { value: '3', text: '3. Challenging' },
        { value: '4', text: '4. Struggled' },
        { value: '5', text: '5. Impossible' },
    ];
    // build the form in HTML
    //  - Exercise name input with autocomplete from past exercises
    //  - A table for sets with weight/reps inputs
    //  - "Add Set" button to add more rows
    //  - Difficulty dropdown (1-5 scale)
    //  - Notes textarea for additional details
    exerciseFormContainer.innerHTML = `
    <div class="exercise-text-container">
      <input list="exercise-name-list" class="exercise-name" placeholder="Enter Exercise" autocomplete="off" required value="${esc(initial.name)}">
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
    const setsTable = exerciseFormContainer.querySelector('.sets-table');
    const addSetBtn = exerciseFormContainer.querySelector('.add-set');
    // add a set row to the table
    function addSetRowTo(setsTable, setNumber, defaults) {
        var _a;
        const setRow = document.createElement("div");
        setRow.className = "set-row";
        // if no set number is provided, count the number of existing rows and add 1
        !setNumber &&
            (setNumber = setsTable.querySelectorAll(".set-row").length + 1);
        setRow.innerHTML = `
      <span class="set-number" aria-label="Set ${setNumber}">${setNumber}</span>
      <input type="text" inputmode="decimal" placeholder="Weight" class="set-weight" value="${defaults.weight || ''}">
      <input type="text" inputmode="numeric" placeholder="Reps" class="set-reps" value="${defaults.reps || ''}">
      <button type="button" class="x-delete-btn remove-set" aria-label="Remove set">✕</button>
    `;
        // Add numeric input validation, to only allow digits and decimals
        function validateNumericInput(input, allowDecimal = false) {
            input.addEventListener("input", () => {
                // remove anything that's not a digit or dot
                let value = input.value.replace(/[^0-9.]/g, "");
                if (allowDecimal) {
                    // keep only the first dot, remove any others
                    const parts = value.split(".");
                    if (parts.length > 1) {
                        value = parts.shift() + "." + parts.join("");
                    }
                }
                else {
                    // remove dots entirely for integer-only inputs
                    value = value.replace(/\./g, "");
                }
                input.value = value;
            });
        }
        // weight allows decimal
        setRow.querySelectorAll(".set-weight").forEach((input) => validateNumericInput(input, true));
        // reps integer only
        setRow.querySelectorAll(".set-reps").forEach((input) => validateNumericInput(input, false));
        // wire up the remove set button
        (_a = setRow.querySelector(".remove-set")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", () => {
            // show a confirmation modal
            openAppModal({
                title: "Delete set?",
                message: "This will remove this set from the exercise.",
                primaryText: "Delete",
                secondaryText: "Cancel",
                // primary action: remove the set
                onPrimary: () => {
                    setRow.remove();
                    // If no sets remain, remove the entire exercise form
                    const setRowCount = setsTable.querySelectorAll(".set-row");
                    if (setRowCount.length === 0) {
                        exerciseFormContainer.remove();
                    }
                    else {
                        // Re-number remaining sets
                        setRowCount.forEach((setRowElement, setIndex) => {
                            const setNumberText = setRowElement.querySelector(".set-number");
                            if (!setNumberText)
                                return;
                            // adds 1 to index to make the set numbers start at 1 instead of 0
                            const newSetNumber = setIndex + 1;
                            // update the set number text and aria label
                            setNumberText.textContent = String(newSetNumber);
                            setNumberText.setAttribute("aria-label", `Set ${newSetNumber}`);
                        });
                    }
                    // Notify the app to save the draft immediately after removal
                    try {
                        document.dispatchEvent(new Event("draft-save-request"));
                    }
                    catch (_) {
                        /* ignore */
                    }
                },
                // secondary action: do nothing
                onSecondary: () => { },
            });
        });
        // add the set row to the table
        setsTable.appendChild(setRow);
    }
    // Map existing sets to rows and add them to the table
    // check if there are initial sets
    if (initial.sets && initial.sets.length) {
        // if there are, map each set to a set row and add it to the table
        initial.sets.forEach((existingSet, setIndex) => {
            const initialInputValues = { weight: existingSet.weight, reps: existingSet.reps };
            addSetRowTo(setsTable, setIndex + 1, initialInputValues);
        });
    }
    else {
        // otherwise, add a default set row
        addSetRowTo(setsTable, 1, { weight: "", reps: "" });
    }
    // wire up the add set button
    addSetBtn === null || addSetBtn === void 0 ? void 0 : addSetBtn.addEventListener('click', () => {
        const currentSetCount = (setsTable === null || setsTable === void 0 ? void 0 : setsTable.querySelectorAll('.set-row').length) || 0;
        addSetRowTo(setsTable, currentSetCount + 1, { weight: "", reps: "" });
    });
    // return the exercise form container
    return exerciseFormContainer;
}
// Read all the exercise forms currently on the page and turn them
// into structured workout data ready for saving.
export function readExercisesFromForms() {
    const exerciseFormContainer = document.getElementById('add-exercise-form');
    // if there are no exercise forms, return an empty array
    if (!exerciseFormContainer)
        return [];
    // map each exercise form to a structured exercise object
    const exerciseForms = [...exerciseFormContainer.querySelectorAll('.add-exercise-form')];
    return exerciseForms.map(form => {
        var _a, _b;
        // get the exercise name and notes if they exist, and trim whitespace
        const exerciseName = (((_a = form.querySelector('.exercise-name')) === null || _a === void 0 ? void 0 : _a.value) || '').trim();
        const exerciseNotes = (((_b = form.querySelector('.exercise-notes')) === null || _b === void 0 ? void 0 : _b.value) || '').trim();
        // get the difficulty text if it exists, otherwise null
        const difficultySelect = form.querySelector('.exercise-difficulty');
        const exerciseDifficulty = (difficultySelect === null || difficultySelect === void 0 ? void 0 : difficultySelect.value) ? difficultySelect.options[difficultySelect.selectedIndex].text : null;
        // get all set rows and map them to structured set objects
        const exerciseSets = [...form.querySelectorAll('.set-row')]
            .map(row => {
            const weightInput = row.querySelector('.set-weight');
            const repsInput = row.querySelector('.set-reps');
            return {
                weight: weightInput ? Number(weightInput.value) : 0,
                reps: repsInput ? Number(repsInput.value) : 0
            };
        })
            // filter out any sets with 0 reps
            .filter(s => s.reps > 0);
        // return the structured exercise object
        return { name: exerciseName, notes: exerciseNotes, difficulty: exerciseDifficulty, sets: exerciseSets };
    })
        // filter out any exercises with no name or sets
        .filter(ex => ex.name && ex.sets.length > 0);
}
//# sourceMappingURL=workout-builder.js.map