import { authClient } from "@/lib/auth-client";

export type DashboardSession =
	| { kind: "loading" }
	| { kind: "authenticated"; user: typeof authClient.$Infer.Session.user }
	| { kind: "unauthenticated" }
	| { kind: "unavailable" };

export function useDashboardSession(): DashboardSession {
	const { data, isPending, error } = authClient.useSession();

	// A background refresh does not invalidate an existing session.
	if (data?.user) return { kind: "authenticated", user: data.user };

	if (isPending) return { kind: "loading" };

	if (error && error.status !== 401) return { kind: "unavailable" };

	return { kind: "unauthenticated" };
}
