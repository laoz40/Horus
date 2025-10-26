// import all the functions and variables we need from other files

import { NAV_BUTTONS } from "./constants.js";
import { saveWorkoutDraft } from "./draft.js";
import { renderHistory, updateLastWorkoutSummary } from "./history.js";
import type { PageChangeEvent } from "./types.js";
import { updateWorkoutButtons } from "./workout-builder.js";

// Connect header nav buttons so clicking them switches pages.
export function wireNavButtons() {
	const navButtons = document.querySelectorAll<HTMLElement>("nav .nav-button");
	navButtons.forEach((button) => {
		button.addEventListener("click", () => {
			const pageId = button.dataset.page as string;
			showPage(pageId);
		});
	});

	// Save the draft when navigating away from the New Workout page
	document.addEventListener("page-will-hide", (e) => {
		const fromId = (e as PageChangeEvent).detail?.pageId;
		if (fromId === "new-workout-page") {
			saveWorkoutDraft();
		}
	});
}

// Show one page by id and hide the others.
// Also triggers a refresh of that page's content when opened.
export function showPage(pageId: string) {
	// Determine the page we are leaving BEFORE toggling classes
	const prevActive = document.querySelector<HTMLElement>(".page.active");

	// Toggle the active class according to the target page id
	const appPage = document.querySelectorAll<HTMLElement>(".page");
	appPage.forEach((page) => {
		page.classList.toggle("active", page.id === pageId);
	});

	// Update nav active state
	for (const btn of NAV_BUTTONS) {
		btn.classList.toggle("nav-active", btn.dataset.page === pageId);
	}

	// Notify listeners we're leaving the PREVIOUS page (if any)
	if (prevActive) {
		try {
			document.dispatchEvent(
				new CustomEvent("page-will-hide", {
					detail: { pageId: prevActive.id },
				}),
			);
		} catch (_) {
			/* ignore */
		}
	}

	// Map each page ID to a function that should run when that page is displayed
	const pageShowFunctions = {
		"new-workout-page": updateWorkoutButtons,
		"history-page": renderHistory,
		"workout-dashboard-page": updateLastWorkoutSummary,
	};

	// If there's a function mapped to this page, call it
	if (pageId in pageShowFunctions) {
		const pageFunction =
			pageShowFunctions[pageId as keyof typeof pageShowFunctions];
		pageFunction();
	}

	// Notify listeners that the target page became visible
	try {
		document.dispatchEvent(
			new CustomEvent("page-did-show", { detail: { pageId } }),
		);
	} catch (_) {
		/* ignore */
	}
}
