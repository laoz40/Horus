// import all the functions and variables we need from other files
import {
	BACK_BUTTON_WORKOUT,
	EXERCISE_FORM_CONTAINER,
	FINISH_WORKOUT_BUTTON,
} from "./constants.js";
import { isInEditMode } from "./history.js";
import { modalMessages, openModal } from "./modal.js";
import type { ExerciseForm, ExerciseSetForm } from "./types.js";
import { esc } from "./utils.js";

// Creates an exercise form
export function createExerciseForm(
	initial: ExerciseForm = { name: "", notes: "", difficulty: "", sets: [] },
) {
	const exerciseFormContainer = document.createElement("div");
	exerciseFormContainer.className = "add-exercise-form";

	// map difficulty values to labels
	const difficultyOptions = [
		{ value: "1", text: "1. Zero effort" },
		{ value: "2", text: "2. Easy" },
		{ value: "3", text: "3. Challenging" },
		{ value: "4", text: "4. Struggled" },
		{ value: "5", text: "5. Impossible" },
	];

	// build the form in HTML
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
        <option value="" disabled ${!initial.difficulty ? "selected" : ""} hidden>Difficulty</option>
        ${difficultyOptions
					.map(
						(opt) => `
          <option value="${opt.value}" ${initial.difficulty === opt.text ? "selected" : ""}>${opt.text}</option>
        `,
					)
					.join("")}
      </select>
      <textarea class="exercise-notes" rows="1" placeholder="Add a note">${initial.notes ? esc(initial.notes) : ""}</textarea>
    </div>
  `;

	const setsTable = exerciseFormContainer.querySelector(".sets-table");
	const addSetBtn = exerciseFormContainer.querySelector(".add-set");

	// add a set row to the table
	function addSetRowTo(
		setsTable: HTMLDivElement,
		setNumber: number,
		defaults: ExerciseSetForm,
	) {
		const setRow = document.createElement("div");
		setRow.className = "set-row";

		// if no set number is provided, count the number of existing rows and add 1
		if (!setNumber) {
			setNumber = setsTable.querySelectorAll(".set-row").length + 1;
		}

		setRow.innerHTML = `
      <span class="set-number" aria-label="Set ${setNumber}">${setNumber}</span>
      <input type="text" inputmode="decimal" placeholder="Weight" class="set-weight" value="${defaults.weight || ""}">
      <input type="text" inputmode="numeric" placeholder="Reps" class="set-reps" value="${defaults.reps || ""}">
      <button type="button" class="x-delete-btn remove-set" aria-label="Remove set">✕</button>
    `;

		// Add numeric input validation, to only allow digits and decimals
		function validateNumericInput(
			input: HTMLInputElement,
			allowDecimal = false,
		) {
			input.addEventListener("input", () => {
				// remove anything that's not a digit or dot
				let value = input.value.replace(/[^0-9.]/g, "");

				if (allowDecimal) {
					// keep only the first dot, remove any others
					const parts = value.split(".");
					if (parts.length > 1) {
						value = `${parts.shift()}.${parts.join("")}`;
					}
				} else {
					// remove dots entirely for integer-only inputs
					value = value.replace(/\./g, "");
				}
				input.value = value;
			});
		}

		// weight allows decimal
		for (const input of setRow.querySelectorAll(".set-weight")) {
			validateNumericInput(input as HTMLInputElement, true);
		}

		// reps integer only
		for (const input of setRow.querySelectorAll(".set-reps")) {
			validateNumericInput(input as HTMLInputElement, false);
		}

		// wire up the remove set button
		setRow.querySelector(".remove-set")?.addEventListener("click", () => {
			// exercise name value  for the modal message
			const exerciseName =
				exerciseFormContainer.querySelector<HTMLInputElement>(".exercise-name")
					?.value || "this exercise";
			openModal({
				...modalMessages.deleteSet(setNumber, exerciseName),
				// primary action: remove the set
				onPrimary: () => {
					setRow.remove();
					// If no sets remain, remove the entire exercise form
					const SET_ROW = setsTable.querySelectorAll(".set-row");
					if (SET_ROW.length === 0) {
						exerciseFormContainer.remove();
					} else {
						// Re-number remaining sets
						SET_ROW.forEach((setRowElement, setIndex) => {
							const SET_NUMBER = setRowElement.querySelector(".set-number");
							if (!SET_NUMBER) return;
							// adds 1 to index to make the set numbers start at 1 instead of 0
							const newSetNumber = setIndex + 1;
							// update the set number text and aria label
							SET_NUMBER.textContent = String(newSetNumber);
							SET_NUMBER.setAttribute("aria-label", `Set ${newSetNumber}`);
						});
					}
					// Notify the app to save the draft immediately after removal
					try {
						document.dispatchEvent(new Event("draft-save-request"));
					} catch (_) {
						/* ignore */
					}
				},
			});
		});

		// add a set row to the table
		setsTable.appendChild(setRow);
	}

	// Map existing sets to rows and add them to the table
	if (initial.sets?.length) {
		// map each set to a set row and add it to the table
		initial.sets.forEach((existingSet, setIndex) => {
			const initialInputValues = {
				weight: existingSet.weight,
				reps: existingSet.reps,
			};
			addSetRowTo(
				setsTable as HTMLDivElement,
				setIndex + 1,
				initialInputValues as ExerciseSetForm,
			);
		});
	} else {
		// otherwise, add a default set row
		addSetRowTo(setsTable as HTMLDivElement, 1, { weight: "", reps: "" });
	}

	// wire up the add set button
	addSetBtn?.addEventListener("click", () => {
		const currentSetCount = setsTable?.querySelectorAll(".set-row").length || 0;
		addSetRowTo(setsTable as HTMLDivElement, currentSetCount + 1, {
			weight: "",
			reps: "",
		});
	});
	// return the exercise form container
	return exerciseFormContainer;
}

// Read all the exercise forms currently on the page and turn them
// into structured workout data ready for saving.
export function readExercisesFromForms() {
	// if there are no exercise forms, return an empty array
	if (!EXERCISE_FORM_CONTAINER) return [];
	// map each exercise form to a structured exercise object
	const exerciseForms = [
		...EXERCISE_FORM_CONTAINER.querySelectorAll(".add-exercise-form"),
	];
	return (
		exerciseForms
			.map((form) => {
				// get the exercise name and notes if they exist, and trim whitespace
				const exerciseName = (
					(form.querySelector(".exercise-name") as HTMLInputElement)?.value ||
					""
				).trim();
				const exerciseNotes = (
					(form.querySelector(".exercise-notes") as HTMLInputElement)?.value ||
					""
				).trim();
				// get the difficulty text if it exists, otherwise null
				const difficultySelect = form.querySelector(
					".exercise-difficulty",
				) as HTMLSelectElement;
				const exerciseDifficulty = difficultySelect?.value
					? difficultySelect.options[difficultySelect.selectedIndex].text
					: null;
				// get all set rows and map them to structured set objects
				const exerciseSets = [...form.querySelectorAll(".set-row")]
					.map((row) => {
						const weightInput = row.querySelector(
							".set-weight",
						) as HTMLInputElement;
						const repsInput = row.querySelector(
							".set-reps",
						) as HTMLInputElement;

						return {
							weight: weightInput ? Number(weightInput.value) : 0,
							reps: repsInput ? Number(repsInput.value) : 0,
						};
					})
					// filter out any sets with 0 reps
					.filter((s) => s.reps > 0);
				// return the structured exercise object
				return {
					name: exerciseName,
					notes: exerciseNotes,
					difficulty: exerciseDifficulty,
					sets: exerciseSets,
				};
			})
			// filter out any exercises with no name or sets
			.filter((ex) => ex.name && ex.sets.length > 0)
	);
}

export function updateWorkoutButtons() {
	if (isInEditMode()) {
		// update buttons in edit mode
		if (BACK_BUTTON_WORKOUT) {
			BACK_BUTTON_WORKOUT.classList.replace("secondary", "danger-secondary");
			BACK_BUTTON_WORKOUT.textContent = "Discard";
		}
		if (FINISH_WORKOUT_BUTTON) {
			FINISH_WORKOUT_BUTTON.textContent = "Save";
		}
	} else {
		// else revert buttons
		if (BACK_BUTTON_WORKOUT) {
			BACK_BUTTON_WORKOUT.classList.replace("danger-secondary", "secondary");
			BACK_BUTTON_WORKOUT.textContent = "Back";
		}
		if (FINISH_WORKOUT_BUTTON) {
			FINISH_WORKOUT_BUTTON.textContent = "Finish";
		}
	}
}
