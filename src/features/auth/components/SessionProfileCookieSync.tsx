"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { saveProfileCookie } from "@/features/auth/lib/profileCookie";

export default function SessionProfileCookieSync() {
	const { data, error, isPending, isRefetching } = authClient.useSession();

	// Refresh display metadata after verified session changes; retain it on network errors.
	useEffect(() => {
		if (!isPending && !isRefetching && (!error || error.status === 401)) saveProfileCookie(data);
	}, [data, error, isPending, isRefetching]);

	return null;
}
