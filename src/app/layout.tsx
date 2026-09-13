import type { Metadata, Viewport } from "next";
import "@/app/globals.css";
import { ThemeProvider } from "next-themes";
import { Oxanium } from "next/font/google";
import DeferredToaster from "@/components/DeferredToaster";
import RestTimerButton from "@/components/RestTimerButton";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import { themeProviderProps } from "@/lib/theme";
import { Providers } from "@/app/providers";

export const metadata: Metadata = {
	title: "Horus",
	description: "A web app to track gym workouts and show cool stats.",
	manifest: "/manifest.webmanifest",
	appleWebApp: {
		capable: true,
		statusBarStyle: "black-translucent",
		title: "Horus",
	},
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	viewportFit: "cover",
};

const oxanium = Oxanium({
	subsets: ["latin"],
});

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			className={oxanium.className}
			suppressHydrationWarning>
			<body className="flex flex-col h-dvh w-full dark:bg-background relative">
				<DeferredToaster />
				<ServiceWorkerRegistration />
				<ThemeProvider {...themeProviderProps}>
					<Providers>
						<RestTimerButton />
						{children}
					</Providers>
				</ThemeProvider>
			</body>
		</html>
	);
}
