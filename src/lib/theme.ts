import type { ThemeProviderProps } from "next-themes";

// Single source of truth for app theming, shared by the root layout and
// global-error (which renders without the root layout) so they stay in sync.
export const themeProviderProps = {
	attribute: "class",
	defaultTheme: "system",
	themes: ["light", "dark", "black"],
	value: {
		light: "light",
		dark: "dark",
		black: "black",
	},
	enableSystem: true,
	disableTransitionOnChange: true,
} satisfies ThemeProviderProps;
