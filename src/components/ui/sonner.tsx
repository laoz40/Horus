"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

// The app's "glass" theme has no sonner equivalent, so it falls back to dark.
const resolveToasterTheme = (theme: string): ToasterProps["theme"] => {
  if (theme === "glass") return "dark"
  if (theme === "light" || theme === "dark" || theme === "system") return theme
  return "system"
}

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()
  // Sonner theming is driven by CSS custom properties, which React's CSSProperties type doesn't cover.
  const toasterStyle: React.CSSProperties & Record<`--${string}`, string> = {
    "--normal-bg": "var(--input)",
    "--normal-text": "var(--foreground)",
    "--normal-border": "var(--border)",
    "--border-radius": "var(--radius)",
  }

  return (
    <Sonner
      theme={resolveToasterTheme(theme)}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={toasterStyle}
      {...props}
    />
  )
}

export { Toaster }
