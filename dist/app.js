// import all the functions and variables we need from other files
import { wireUiEvents } from './ui-events.js';
import { showPage } from './nav.js';
document.addEventListener('DOMContentLoaded', () => {
    // show the workout dashboard page
    showPage('workout-dashboard-page');
    // wire up all the UI events
    wireUiEvents();
});
//# sourceMappingURL=app.js.map