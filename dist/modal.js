// creates a modal dialog with a title, message, and optional primary and secondary buttons
export function openAppModal({ title = "Notice", message = "", primaryText = "OK", primaryButtonClass = "", secondaryText = "", onPrimary = null, onSecondary = null, onBackdropClick = null, dismissOnBackdrop = true, dismissOnEsc = true, } = {}) {
    const modalBgOverlay = document.getElementById("app-modal-overlay");
    const modalTitle = document.getElementById("app-modal-title");
    const modalMessage = document.getElementById("app-modal-message");
    const modalPrimaryBtn = document.getElementById("app-modal-primary-btn");
    const modalSecondaryBtn = document.getElementById("app-modal-secondary-btn");
    // Fallbacks for when the modal elements don't exist
    if (!modalBgOverlay || !modalTitle || !modalMessage || !modalPrimaryBtn || !modalSecondaryBtn) {
        if (secondaryText) {
            // Fallback to ok/cancel if secondary button is specified
            const ok = confirm(`${title ? title + "\n\n" : ""}${message}`.trim());
            // Call the primary callback if the user clicked OK
            if (ok && typeof onPrimary === "function")
                onPrimary();
            // Call the secondary callback if the user clicked Cancel
            if (!ok && typeof onSecondary === "function")
                onSecondary();
        }
        else {
            // Simple alert fallback if no secondary button
            alert(`${title ? title + "\n\n" : ""}${message}`.trim());
            // Call the primary callback if the user clicked OK
            if (typeof onPrimary === "function")
                onPrimary();
        }
        // exit after fallback if we don't have the modal elements
        return;
    }
    // Set title, message, and primary button text to the provided values
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modalPrimaryBtn.textContent = primaryText || "OK";
    // Set primary button class
    modalPrimaryBtn.className = ""; // Reset any existing classes
    primaryButtonClass && modalPrimaryBtn.classList.add(primaryButtonClass);
    // If secondary button is specified, set its text and visibility
    if (modalSecondaryBtn) {
        if (secondaryText) {
            modalSecondaryBtn.textContent = secondaryText;
            modalSecondaryBtn.hidden = false;
        }
        else {
            modalSecondaryBtn.hidden = true;
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
    const onBackdrop = (e) => {
        if (dismissOnBackdrop && e.target === modalBgOverlay) {
            // check for function in case its null
            if (typeof onBackdropClick === "function") {
                onBackdropClick();
                // fallback to secondary click if no function
            }
            else {
                onSecondaryClick();
            }
        }
    };
    // Event listener for escape key
    const onEsc = (e) => dismissOnEsc && e.key === "Escape" && onSecondaryClick();
    // Show the modal and add event listeners
    modalBgOverlay.hidden = false;
    modalBgOverlay.setAttribute("aria-hidden", "false");
    modalPrimaryBtn.addEventListener("click", onPrimaryClick, { once: true });
    modalSecondaryBtn &&
        !modalSecondaryBtn.hidden &&
        modalSecondaryBtn.addEventListener("click", onSecondaryClick, {
            once: true,
        });
    modalBgOverlay.addEventListener("click", onBackdrop);
    document.addEventListener("keydown", onEsc);
    // Close the modal and remove event listeners
    const closeModal = () => {
        modalBgOverlay.hidden = true;
        modalBgOverlay.setAttribute("aria-hidden", "true");
        modalPrimaryBtn.removeEventListener("click", onPrimaryClick);
        modalSecondaryBtn &&
            modalSecondaryBtn.removeEventListener("click", onSecondaryClick);
        modalBgOverlay.removeEventListener("click", onBackdrop);
        document.removeEventListener("keydown", onEsc);
    };
}
//# sourceMappingURL=modal.js.map