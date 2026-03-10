import { redirect } from "next/navigation";

import { api } from "@/convex/_generated/api";
import { fetchAuthQuery } from "@/lib/auth-server";

import WelcomeNameForm from "@/features/auth/components/WelcomeNameForm";

export default async function WelcomePage() {
	const user = await fetchAuthQuery(api.auth.getCurrentUser);

	if (!user) {
		redirect("/login");
	}

	if (user.name) {
		redirect("/");
	}

	return (
		<div className="flex min-h-dvh flex-col items-center justify-center px-4">
			<h1 className="text-xl font-semibold">Welcome to Horus</h1>
			<WelcomeNameForm />
		</div>
	);
}
