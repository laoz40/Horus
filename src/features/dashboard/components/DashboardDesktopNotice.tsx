import { IconAlertCircle } from "@tabler/icons-react";

import { Alert, AlertDescription } from "@/components/ui/alert";

export default function DashboardDesktopNotice() {
	return (
		<Alert className="hidden border-muted-foreground/20 bg-muted/50 min-[1366px]:block">
			<AlertDescription>
				<IconAlertCircle className="size-7" />
				<p className="text-foreground">
					This app&apos;s UI was designed and optimised for mobile screens. It still works on larger
					screens, but what are you doing with a laptop at the gym lol.
				</p>
				<p className="mt-2 text-foreground">Shortcut to open mobile viewport:</p>
				<div className="flex flex-row gap-4">
					<p className="text-muted-foreground">
						<strong>Chrome:</strong> Ctrl + Shift + I, then Ctrl + Shift + M{" "}
					</p>
					<p className="text-muted-foreground">
						<strong>Firefox:</strong> Ctrl + Shift + M{" "}
					</p>
				</div>
			</AlertDescription>
		</Alert>
	);
}
