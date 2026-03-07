"use client";

import dynamic from "next/dynamic";

const Toaster = dynamic(
	() => import("@/components/ui/sonner").then((module) => module.Toaster),
	{ ssr: false },
);

export default function DeferredToaster() {
	return <Toaster />;
}
