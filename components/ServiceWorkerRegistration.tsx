"use client";

import { useEffect, type ReactElement } from "react";

export default function ServiceWorkerRegistration(): ReactElement | null {
	useEffect(() => {
		// Service workers only exist in browsers, not during server rendering.
		if (!("serviceWorker" in navigator)) return;

		// Register the small background helper after the page finishes loading.
		// We use it for showing notifications and handling notification taps.
		const register = () => {
			void navigator.serviceWorker.register("/sw.js");
		};

		// If the page has already loaded, register now.
		if (document.readyState === "complete") {
			register();
			return;
		}

		// Otherwise, wait for the load event and clean up the listener if needed.
		window.addEventListener("load", register, { once: true });

		return () => window.removeEventListener("load", register);
	}, []);

	return null;
}
