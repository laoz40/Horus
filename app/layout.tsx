import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Oxanium } from "next/font/google";
import DeferredToaster from "@/components/DeferredToaster";
import ConvexClientProvider from "./ConvexClientProvider";
import { getToken } from "@/lib/auth-server";
import { Providers } from "./providers";

export const metadata: Metadata = {
	title: "Horus",
	description: "A web app to track gym workouts and show cool stats.",
};

const oxanium = Oxanium({
	subsets: ["latin"],
});

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const initialToken = await getToken();

	return (
		<html
			lang="en"
			className={oxanium.className}
			suppressHydrationWarning>
			<body className="flex flex-col h-dvh w-full dark:bg-background relative">
				<DeferredToaster />
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
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					themes={["light", "dark", "glass"]}
					value={{
						light: "light",
						dark: "dark",
						glass: "glass",
					}}
					enableSystem
					disableTransitionOnChange>
					<ConvexClientProvider initialToken={initialToken}>
						<Providers>{children}</Providers>
					</ConvexClientProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
