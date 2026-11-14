"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Data, Effect } from "effect";

import { authClient } from "@/lib/auth-client";
import { orpc } from "@/lib/orpc/client";
import { showErrorToast } from "@/lib/toastMessages";

class SignOutError extends Data.TaggedError("SignOutError")<{
	cause: unknown;
}> {}

export default function useSignOut() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [isSigningOut, setIsSigningOut] = useState(false);

	const signOut = async () => {
		if (isSigningOut) return;

		setIsSigningOut(true);

		await Effect.runPromise(
			Effect.tryPromise({
				try: () => authClient.signOut({ fetchOptions: { throw: true } }),
				catch: (cause) => new SignOutError({ cause }),
			}).pipe(
				Effect.tap(() =>
					Effect.gen(function* () {
						yield* Effect.promise(() =>
							queryClient.cancelQueries({ queryKey: orpc.dashboard.key() }),
						);

						queryClient.removeQueries({ queryKey: orpc.dashboard.key() });
						router.refresh();
						router.replace("/");
					}),
				),
				Effect.catchTag("SignOutError", () =>
					Effect.sync(() => showErrorToast("Couldn't sign out. Please try again.")),
				),
				Effect.ensuring(Effect.sync(() => setIsSigningOut(false))),
			),
		);
	};

	return { isSigningOut, signOut };
}
