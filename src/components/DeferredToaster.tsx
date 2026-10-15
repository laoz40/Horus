"use client";

import dynamic from "next/dynamic";

const Toaster = dynamic(() => import("@/components/ui/sonner").then((module) => module.Toaster), {
	ssr: false,
});

export default function DeferredToaster() {
	// In the iOS PWA, viewport-fit=cover lets fixed toasts overlap the status bar and notch.
	// Sonner's mobile offset defaults to 16px, so add the safe area explicitly.
	return <Toaster mobileOffset={{ top: "calc(env(safe-area-inset-top, 0px) + 16px)" }} />;
}
