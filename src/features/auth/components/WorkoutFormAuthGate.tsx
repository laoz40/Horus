"use client";

import { authClient } from "@/lib/auth-client";

import SignUpDialog from "@/features/auth/components/SignUpDialog";

export default function WorkoutFormAuthGate() {
	const { data: sessionData, isPending } = authClient.useSession();

	if (isPending) {
		return null;
	}

	if (sessionData?.user) {
		return null;
	}

	return <SignUpDialog show />;
}
