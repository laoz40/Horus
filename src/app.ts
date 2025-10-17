// import all the functions and variables we need from other files

import { showPage } from "./nav.js";
import { wireUiEvents } from "./ui-events.js";

document.addEventListener("DOMContentLoaded", () => {
	// show the workout dashboard page
	showPage("workout-dashboard-page");

	// wire up all the UI events
	wireUiEvents();
});
