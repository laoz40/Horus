"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { showErrorToast } from "@/lib/toastMessages";

const toastMessages = {
	edit_not_found: "Workout not found.",
	edit_db_failed: "Couldn't access the database. Please try again.",
	edit_unexpected: "Unexpected error loading workout.",
} as const;

interface WorkoutRedirectToastProps {
	toast?: string;
}

export default function WorkoutRedirectToast({ toast }: WorkoutRedirectToastProps) {
	const pathname = usePathname();
	const router = useRouter();

	useEffect(() => {
		if (!toast || !(toast in toastMessages)) return;

		showErrorToast(toastMessages[toast as keyof typeof toastMessages]);

		// remove toast from url
		router.replace(pathname);
	}, [pathname, router, toast]);

	return null;
}
