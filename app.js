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
});