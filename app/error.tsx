"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
	retry,
}: {
	error: Error & { digest?: string };
	retry: () => void;
}) {
	return (
		<div className="flex flex-col items-center gap-3 py-10 text-center">
			<p className="text-sm text-muted-foreground">Something went wrong.</p>
			<Button
				type="button"
				onClick={retry}
				variant="outline">
				Try again
			</Button>
		</div>
	);
}
