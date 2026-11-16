"use client";

import DashboardProfileFallback from "@/features/auth/components/DashboardProfileFallback";
import {
	paintSavedProfileFromCookie,
	profileCookieName,
	savedProfileId,
	savedProfileScript,
} from "@/features/auth/lib/profileCookie";

// Inline scripts run on document loads; the ref handles client navigation before paint.
const restoreSavedProfile = (element: HTMLDivElement | null) => {
	if (element) paintSavedProfileFromCookie(savedProfileId, profileCookieName);
};

export default function DashboardSavedProfile({ isPending }: { isPending: boolean }) {
	return (
		<>
			{/* Only the saved profile's marked attributes and text are changed before hydration. */}
			<div
				ref={restoreSavedProfile}
				id={savedProfileId}
				className="group"
				suppressHydrationWarning>
				<div className="hidden flex-row items-start justify-between group-data-[profile=ready]:flex">
					<div className="flex flex-col">
						<h2 className="text-sm font-normal text-muted-foreground">Welcome back,</h2>
						<h1
							data-profile-name
							suppressHydrationWarning
							className="text-2xl leading-tight font-semibold tracking-tight">
							Legend
						</h1>
					</div>
					<div
						aria-hidden="true"
						className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-primary-foreground">
						<span
							data-profile-initials
							suppressHydrationWarning>
							L
						</span>
						<span
							data-profile-image
							suppressHydrationWarning
							className="absolute inset-0 bg-cover bg-center"
						/>
					</div>
				</div>
				<div className="flex flex-row items-start justify-between group-data-[profile=ready]:hidden">
					<DashboardProfileFallback isPending={isPending} />
				</div>
			</div>
			<script
				suppressHydrationWarning
				dangerouslySetInnerHTML={{ __html: savedProfileScript }}
			/>
		</>
	);
}
