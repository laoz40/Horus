import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth-server";

export default async function MigrationPreviewPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/login?callbackURL=/migration-preview");
	}

	return (
		<main className="flex min-h-dvh items-center justify-center px-4">
			<section className="w-full max-w-md space-y-4 rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
				<div>
					<p className="text-sm text-muted-foreground">PostgreSQL auth connected</p>
					<h1 className="text-xl font-semibold">Migration preview</h1>
				</div>
				<dl className="space-y-2 text-sm">
					<div>
						<dt className="text-muted-foreground">Email</dt>
						<dd>{session.user.email}</dd>
					</div>
					<div>
						<dt className="text-muted-foreground">PostgreSQL user ID</dt>
						<dd className="break-all font-mono text-xs">{session.user.id}</dd>
					</div>
				</dl>
			</section>
		</main>
	);
}
