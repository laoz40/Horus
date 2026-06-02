// This service worker helps with notifications for the rest timer.

// Use this service worker right away instead of waiting for old tabs to close.
self.addEventListener("install", () => {
	self.skipWaiting();
});

// Start controlling already-open app tabs as soon as the worker activates.
self.addEventListener("activate", (event) => {
	event.waitUntil(self.clients.claim());
});

// The user tapped a notification. Close it first.
self.addEventListener("notificationclick", (event) => {
	event.notification.close();

	event.waitUntil(
		// Find open windows or tabs for this app.
		self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
			const existingClient = clients.find((client) => "focus" in client);

			// If the app is already open, bring it to the front.
			if (existingClient) {
				return existingClient.focus();
			}

			// If the app is not open, open the home page.
			if (self.clients.openWindow) {
				return self.clients.openWindow("/");
			}
		}),
	);
});
