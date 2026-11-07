"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

import SignUpDialog from "@/features/auth/components/SignUpDialog";

export default function WorkoutFormAuthGate() {
	const { data: sessionData, isPending } = authClient.useSession();
	const [mountState, setMountState] = useState<"mounting" | "mounted">("mounting");

	// Allow the signed-out prompt to appear after the page mounts in the browser.
	useEffect(() => {
		setMountState("mounted");
	}, []);

	if (isPending || mountState === "mounting") {
		return null;
	}

	if (sessionData?.user) {
		return null;
	}

	return <SignUpDialog show />;
}
