import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

export interface LoadingSpinnerProps {
  /** Message shown next to the spinner. */
  message?: string
  /** Size of the spinner and text. */
  size?: "sm" | "default"
  /** Use full-page centering (min-h for entire viewport area). */
  fullPage?: boolean
  /** Extra class name for the wrapper. */
  className?: string
}

/**
 * Centered loading state with spinner and text. Use for page or section loading.
 */
export function LoadingSpinner({
  message = "Loading…",
  size = "default",
  fullPage = false,
  className,
}: LoadingSpinnerProps) {
  const isSm = size === "sm"
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 text-muted-foreground",
        fullPage && "min-h-[50vh] p-6",
        !fullPage && "p-6",
        isSm ? "text-xs" : "text-sm",
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <Loader2
        className={cn("animate-spin", isSm ? "size-4" : "size-5")}
        aria-hidden
      />
      <span>{message}</span>
    </div>
  )
}
