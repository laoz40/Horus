"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { showErrorToast } from "@/lib/toastMessages";

const toastMessages = {
	edit_not_found: "Workout not found.",
	edit_db_failed: "Couldn't access the database. Please try again.",
	edit_unexpected: "Unexpected error loading workout.",
} as const;

export default function WorkoutRedirectToast() {
	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();

	useEffect(() => {
		const toastCode = searchParams.get("toast");
		if (!toastCode || !(toastCode in toastMessages)) return;

		showErrorToast(toastMessages[toastCode as keyof typeof toastMessages]);

		// remove toast from url
		router.replace(pathname);
	}, [pathname, router, searchParams]);

	return null;
}
