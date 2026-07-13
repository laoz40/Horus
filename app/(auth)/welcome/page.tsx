import { headers } from "next/headers";
import { redirect } from "next/navigation";

import WelcomeNameForm from "@/features/auth/components/WelcomeNameForm";
import { auth } from "@/lib/auth-server";

export default async function WelcomePage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/login");
	}

	if (session.user.name) {
		redirect("/");
	}

	return (
		<div className="flex min-h-dvh flex-col items-center justify-center px-4">
			<h1 className="text-xl font-semibold">Welcome to Horus</h1>
			<WelcomeNameForm />
		</div>
	);
}
