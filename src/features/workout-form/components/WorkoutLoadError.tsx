"use client";

import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface WorkoutLoadErrorProps {
	message: string;
	action:
		| { type: "none" }
		| { type: "retry"; onRetry: () => void }
		| { type: "link"; href: string; label: string };
}

export default function WorkoutLoadError({ message, action }: WorkoutLoadErrorProps) {
	return (
		<div className="ios-safe-area-top flex flex-1 items-center justify-center px-4 py-6 md:py-10">
			<Alert className="max-w-lg">
				<AlertTitle>Couldn&apos;t load workout</AlertTitle>
				<AlertDescription className="gap-4">
					<p>{message}</p>
					<div className="flex flex-wrap gap-2">
						{action.type === "retry" ? (
							<Button
								type="button"
								onClick={action.onRetry}>
								Try again
							</Button>
						) : null}
						{action.type === "link" ? (
							<Button asChild>
								<Link href={action.href}>{action.label}</Link>
							</Button>
						) : null}
						<Button
							asChild
							variant="outline">
							<Link href="/workouts">Back to history</Link>
						</Button>
					</div>
				</AlertDescription>
			</Alert>
		</div>
	);
}
