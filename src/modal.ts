import { MODAL_BG_OVERLAY, MODAL_TITLE, MODAL_MESSAGE, MODAL_PRIMARY_BUTTON, MODAL_SECONDARY_BUTTON } from "./constants.js";

// creates a modal dialog with a title, message, and optional primary and secondary buttons
export function openAppModal({
  title = "Notice",
  message = "",
  primaryText = "OK",
  primaryButtonClass = "",
  secondaryText = "",
  onPrimary = null as (() => void) | null,
  onSecondary = null as (() => void) | null,
  onBackdropClick = null as (() => void) | null,
  dismissOnBackdrop = true,
  dismissOnEsc = true,
} = {}) {
  // Fallbacks for when the modal elements don't exist
  if (!MODAL_BG_OVERLAY || !MODAL_TITLE || !MODAL_MESSAGE || !MODAL_PRIMARY_BUTTON || !MODAL_SECONDARY_BUTTON) {
    if (secondaryText) {
      // Fallback to ok/cancel if secondary button is specified
      const ok = confirm(`${title ? title + "\n\n" : ""}${message}`.trim());
      // Call the primary callback if the user clicked OK
      if (ok && typeof onPrimary === "function") onPrimary();
      // Call the secondary callback if the user clicked Cancel
      if (!ok && typeof onSecondary === "function") onSecondary();
    } else {
      // Simple alert fallback if no secondary button
      alert(`${title ? title + "\n\n" : ""}${message}`.trim());
      // Call the primary callback if the user clicked OK
      if (typeof onPrimary === "function") onPrimary();
    }
    // exit after fallback if we don't have the modal elements
    return;
  }

  // Set title, message, and primary button text to the provided values
  MODAL_TITLE.textContent = title;
  MODAL_MESSAGE.textContent = message;
  MODAL_PRIMARY_BUTTON.textContent = primaryText || "OK";

  // Set primary button class
  MODAL_PRIMARY_BUTTON.className = ""; // Reset any existing classes
  primaryButtonClass && MODAL_PRIMARY_BUTTON.classList.add(primaryButtonClass);

  // If secondary button is specified, set its text and visibility
  if (MODAL_SECONDARY_BUTTON) {
    if (secondaryText) {
      MODAL_SECONDARY_BUTTON.textContent = secondaryText;
      MODAL_SECONDARY_BUTTON.hidden = false;
    } else {
      MODAL_SECONDARY_BUTTON.hidden = true;
    }
  }

  // Event listeners for primary and secondary modal buttons
  const onPrimaryClick = () => {
    closeModal();
    // check for function in case its null
    typeof onPrimary === "function" && onPrimary();
  };
  const onSecondaryClick = () => {
    closeModal();
    // check for function in case its null
    typeof onSecondary === "function" && onSecondary();
  };
  const onBackdrop = (e: MouseEvent) => {
    if (dismissOnBackdrop && e.target === MODAL_BG_OVERLAY) {
      // check for function in case its null
      if (typeof onBackdropClick === "function") {
        onBackdropClick();
        // fallback to secondary click if no function
      } else {
        onSecondaryClick();
      }
    }
  };
  // Event listener for escape key
  const onEsc = (e: KeyboardEvent) => dismissOnEsc && e.key === "Escape" && onSecondaryClick();

  // Show the modal and add event listeners
  MODAL_BG_OVERLAY.hidden = false;
  MODAL_BG_OVERLAY.setAttribute("aria-hidden", "false");
  MODAL_PRIMARY_BUTTON.addEventListener("click", onPrimaryClick, { once: true });
  MODAL_SECONDARY_BUTTON &&
    !MODAL_SECONDARY_BUTTON.hidden &&
    MODAL_SECONDARY_BUTTON.addEventListener("click", onSecondaryClick, {
      once: true,
    });
  MODAL_BG_OVERLAY.addEventListener("click", onBackdrop);
  document.addEventListener("keydown", onEsc);



  // Close the modal and remove event listeners
  const closeModal = () => {
    // Hide the modal overlay if it exists
    MODAL_BG_OVERLAY?.setAttribute("aria-hidden", "true");
    MODAL_BG_OVERLAY && (MODAL_BG_OVERLAY.hidden = true);
    
    // Clean up event listeners
    MODAL_PRIMARY_BUTTON?.removeEventListener("click", onPrimaryClick);
    MODAL_SECONDARY_BUTTON?.removeEventListener("click", onSecondaryClick);
    MODAL_BG_OVERLAY?.removeEventListener("click", onBackdrop);
    document.removeEventListener("keydown", onEsc);
  };
}
