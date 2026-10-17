import { Effect } from "effect";

import type { authClient } from "@/lib/auth-client";

export const profileCookieName = "horus_profile";

export const savedProfileId = "dashboard-saved-profile";

type SessionData = typeof authClient.$Infer.Session;

// This cookie is a display hint only. Never use it to authorize requests.
export function saveProfileCookie(session: SessionData | null): void {
	const writeCookie = Effect.try(() => {
		const expires = session ? new Date(session.session.expiresAt).getTime() : 0;

		const value = session
			? new URLSearchParams({
					name: (session.user.name ?? "Legend").slice(0, 256),
					image: session.user.image ?? "",
					expires: String(expires),
				}).toString()
			: "";

		const secure = location.protocol === "https:" ? "; Secure" : "";

		// Leave room below the browser's cookie size limit for attributes.
		const maxAge =
			value.length <= 3500 ? Math.max(0, Math.floor((expires - Date.now()) / 1000)) : 0;

		document.cookie = `${profileCookieName}=${maxAge > 0 ? value : ""}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
	});

	// Ignore failures saving the optional name/avatar cookie so sign-in and sign-out still work.
	Effect.runSync(Effect.ignore(writeCookie));
}

// Keep this function self-contained: the same code runs inline before hydration
// and in a layout effect when the dashboard mounts through client navigation.
export function paintSavedProfileFromCookie(rootId: string, cookieName: string): void {
	try {
		const cookie = document.cookie.split("; ").find((part) => part.startsWith(`${cookieName}=`));
		const profile = new URLSearchParams(cookie?.slice(cookieName.length + 1));
		const name = profile.get("name");
		const root = document.getElementById(rootId);

		if (!root) return;

		const heading = root.querySelector<HTMLElement>("[data-profile-name]");
		const initials = root.querySelector<HTMLElement>("[data-profile-initials]");
		const avatar = root.querySelector<HTMLElement>("[data-profile-image]");

		if (
			!heading ||
			!initials ||
			!avatar ||
			!name ||
			name.length > 256 ||
			!(Number(profile.get("expires")) > Date.now())
		)
			return;

		heading.textContent = name;
		initials.textContent = name
			.trim()
			.split(/\s+/)
			.slice(0, 2)
			.map((part) => part[0])
			.join("")
			.toUpperCase();
		const image = profile.get("image");

		if (image && /^https?:\/\//i.test(image))
			avatar.style.backgroundImage = `url(${JSON.stringify(image)})`;
		root.dataset.profile = "ready";
	} catch {
		// Malformed or unavailable cookies leave the existing skeleton visible.
	}
}

export const savedProfileScript = `(${paintSavedProfileFromCookie.toString()})(${JSON.stringify(savedProfileId)},${JSON.stringify(profileCookieName)})`;
