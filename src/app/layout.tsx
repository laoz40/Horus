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
				{/* Cosmic Nebula */}
				<div
					className="absolute inset-0 -z-100 hidden glass:block"
					style={{
						background: `
          radial-gradient(ellipse 70% 55% at 20% 50%, rgba(50, 20, 147, 0.15), transparent 60%),
            radial-gradient(ellipse 160% 130% at 30% 30%, rgba(0, 255, 255, 0.12), transparent 40%),
            radial-gradient(ellipse 160% 130% at 70% 90%, rgba(38, 43, 226, 0.18), transparent 35%),
            radial-gradient(ellipse 110% 50% at 80% 30%, rgba(255, 215, 0, 0.08), transparent 30%),
            #000000
     `,
					}}
				/>
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
