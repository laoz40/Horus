"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

export default function useSignOut() {
	const router = useRouter();
	const [isSigningOut, setIsSigningOut] = useState(false);

	const signOut = async () => {
		if (isSigningOut) return;

		setIsSigningOut(true);

		try {
			await authClient.signOut();
		} finally {
			router.refresh();
			router.replace("/");
			setIsSigningOut(false);
		}
	};

	return { isSigningOut, signOut };
}
