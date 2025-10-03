// import all the functions and variables we need from other files
import { renderHistory, updateLastWorkoutSummary } from './history.js';
import { saveDraftNow, restoreDraftIfAny } from './draft.js';

// Show one page by id and hide the others.
// Also triggers a refresh of that page's content when opened.
export function showPage(pageId) {
  const pages = document.querySelectorAll('.page');
  // Find the currently active page (to notify listeners we're leaving it)
  const currentActive = document.querySelector('.page.active');
  if (currentActive) {
    try {
      document.dispatchEvent(new CustomEvent('page-will-hide', { detail: { pageId: currentActive.id } }));
    } catch (_) { /* ignore */ }
  }

  pages.forEach(page => {
    page.classList.toggle('active', page.id === pageId);
  });
  // Render on demand
  if (pageId === 'history-page') {
    renderHistory();
  } else if (pageId === 'workout-dashboard-page') {
    updateLastWorkoutSummary();
  }

  // Update nav active state
  const navButtons = document.querySelectorAll('nav .nav-button');
  navButtons.forEach(btn => btn.classList.toggle('nav-active', btn.dataset.page === pageId));

  // Notify listeners that a page became visible
  try {
    document.dispatchEvent(new CustomEvent('page-did-show', { detail: { pageId } }));
  } catch (_) { /* ignore */ }
}

/**
 * Connect header nav buttons so clicking them switches pages.
 */
export function wireNavButtons() {
  const navButtons = document.querySelectorAll('nav .nav-button');
  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      const pageId = button.dataset.page;
      showPage(pageId);
    });
  });

  // Save the draft when navigating away from the New Workout page
  document.addEventListener('page-will-hide', (e) => {
    const fromId = e?.detail?.pageId;
    if (fromId === 'new-workout-page') {
      saveDraftNow();
    }
  });

  // Restore the draft when showing the New Workout page
  document.addEventListener('page-did-show', (e) => {
    const toId = e?.detail?.pageId;
    if (toId === 'new-workout-page') {
      restoreDraftIfAny();
    }
  });
}
