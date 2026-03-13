import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

export interface LoadingSpinnerProps {
  message?: string
  size?: "sm" | "default"
  className?: string
}

export function LoadingSpinner({
  message = "Loading…",
  size = "default",
  className,
}: LoadingSpinnerProps) {
  const isSm = size === "sm"
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 text-muted-foreground",
        "p-6",
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
