// Generic App Modal helper
export function openAppModal({
  title = 'Notice',
  message = '',
  primaryText = 'OK',
  primaryButtonClass = '',
  secondaryText = '',
  onPrimary = null,
  onSecondary = null,
  onBackdropClick = null,
  dismissOnBackdrop = true,
  dismissOnEsc = true,
} = {}) {
  const overlay = document.getElementById('app-modal-overlay');
  const titleEl = document.getElementById('app-modal-title');
  const messageEl = document.getElementById('app-modal-message');
  const primaryBtn = document.getElementById('app-modal-primary-btn');
  const secondaryBtn = document.getElementById('app-modal-secondary-btn');

  // Fallbacks if modal markup doesn't exist
  if (!overlay || !titleEl || !messageEl || !primaryBtn) {
    if (secondaryText) {
      // Confirmation style fallback
      const ok = confirm(`${title ? title + "\n\n" : ''}${message}`.trim());
      if (ok && typeof onPrimary === 'function') onPrimary();
      if (!ok && typeof onSecondary === 'function') onSecondary();
    } else {
      // Simple alert fallback
      alert(`${title ? title + "\n\n" : ''}${message}`.trim());
      if (typeof onPrimary === 'function') onPrimary();
    }
    return;
  }

  titleEl.textContent = title;
  messageEl.textContent = message;
  primaryBtn.textContent = primaryText || 'OK';

  // Set primary button class
  primaryBtn.className = ''; // Reset any existing classes
  if (primaryButtonClass) {
    primaryBtn.classList.add(primaryButtonClass);
  }

  // Secondary button visibility/text
  if (secondaryBtn) {
    if (secondaryText) {
      secondaryBtn.textContent = secondaryText;
      secondaryBtn.hidden = false;
    } else {
      secondaryBtn.hidden = true;
    }
  }

  const close = () => {
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');
    primaryBtn.removeEventListener('click', onPrimaryClick);
    secondaryBtn && secondaryBtn.removeEventListener('click', onSecondaryClick);
    overlay.removeEventListener('click', onBackdrop);
    document.removeEventListener('keydown', onEsc);
  };

  const onPrimaryClick = () => { close(); if (typeof onPrimary === 'function') onPrimary(); };
  const onSecondaryClick = () => { close(); if (typeof onSecondary === 'function') onSecondary(); };
  const onBackdrop = (e) => {
    if (dismissOnBackdrop && e.target === overlay) {
      if (typeof onBackdropClick === 'function') {
        onBackdropClick();
      } else {
        onSecondaryClick();
      }
    }
  };
  const onEsc = (e) => { if (dismissOnEsc && e.key === 'Escape') onSecondaryClick(); };

  overlay.hidden = false;
  overlay.setAttribute('aria-hidden', 'false');
  primaryBtn.addEventListener('click', onPrimaryClick, { once: true });
  if (secondaryBtn && !secondaryBtn.hidden) secondaryBtn.addEventListener('click', onSecondaryClick, { once: true });
  overlay.addEventListener('click', onBackdrop);
  document.addEventListener('keydown', onEsc);
}
