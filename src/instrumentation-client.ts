const register = () => {
	void navigator.serviceWorker.register("/sw.js");
};

// Register the rest-notification worker after the page finishes loading.
if ("serviceWorker" in navigator) {
	if (document.readyState === "complete") {
		register();
	} else {
		window.addEventListener("load", register, { once: true });
	}
}
