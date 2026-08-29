"use client";

import "./globals.css";
import { Button } from "@/components/ui/button";

// Replaces the root layout when the error escapes every other boundary,
// so it must render its own <html>/<body>.
export default function GlobalError({
	retry,
}: {
	error: Error & { digest?: string };
	retry: () => void;
}) {
	return (
		<html
			lang="en"
			suppressHydrationWarning>
			<body className="flex flex-col items-center justify-center h-dvh gap-3">
				<p className="text-sm text-muted-foreground">Something went wrong.</p>
				<Button
					type="button"
					onClick={retry}
					variant="outline">
					Try again
				</Button>
			</body>
		</html>
	);
}
