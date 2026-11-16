const register = () => {
	void navigator.serviceWorker.register("/sw.js");
};

// Install the browser helper for rest-timer notifications and opening Horus when one is tapped.
// Wait until the page finishes loading before registering it.
if ("serviceWorker" in navigator) {
	if (document.readyState === "complete") {
		register();
	} else {
		window.addEventListener("load", register, { once: true });
	}
}
