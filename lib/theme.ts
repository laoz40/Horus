import type { ThemeProviderProps } from "next-themes";

// Single source of truth for app theming, shared by the root layout and
// global-error (which renders without the root layout) so they stay in sync.
export const themeProviderProps = {
	attribute: "class",
	defaultTheme: "system",
	themes: ["light", "dark", "glass"],
	value: {
		light: "light",
		dark: "dark",
		glass: "glass",
	},
	enableSystem: true,
	disableTransitionOnChange: true,
} satisfies ThemeProviderProps;
