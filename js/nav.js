// Page navigation and active state handling
import { renderHistory, updateLastWorkoutSummary } from './history.js';

/**
 * Show one page by id and hide the others.
 * Also triggers a refresh of that page's content when opened.
 */
export function showPage(pageId) {
  const pages = document.querySelectorAll('.page');
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
}
