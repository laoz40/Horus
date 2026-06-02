"use client";

import { useEffect, type ReactElement } from "react";

export default function ServiceWorkerRegistration(): ReactElement | null {
	useEffect(() => {
		if (!("serviceWorker" in navigator)) return;

		// Register the small background helper after the page finishes loading.
		// We use it for showing notifications and handling notification taps.
		window.addEventListener("load", () => {
			void navigator.serviceWorker.register("/sw.js");
		});
	}, []);

	return null;
}
