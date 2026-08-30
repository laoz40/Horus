"use client";

import type { ReactElement, ReactNode } from "react";
import { catchError, type ErrorInfo } from "next/error";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
	// Renders the boundary's fallback instead of the default one,
	// e.g. to show an error-specific message.
	fallback?: (errorInfo: ErrorInfo) => ReactNode;
}

function ErrorBoundaryFallback({ fallback }: ErrorBoundaryProps, errorInfo: ErrorInfo): ReactNode {
	if (fallback) {
		return fallback(errorInfo);
	}

	return (
		<div className="flex flex-col items-center gap-3 py-10 text-center">
			<p className="text-sm text-muted-foreground">Something went wrong.</p>
			<Button
				type="button"
				onClick={errorInfo.retry}
				variant="outline">
				Try again
			</Button>
		</div>
	);
}

const CatchErrorBoundary = catchError(ErrorBoundaryFallback);

export default function ErrorBoundary({
	children,
	fallback,
}: ErrorBoundaryProps & { children: ReactNode }): ReactElement {
	return <CatchErrorBoundary fallback={fallback}>{children}</CatchErrorBoundary>;
}
