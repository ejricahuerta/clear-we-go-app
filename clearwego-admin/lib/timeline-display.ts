/**
 * Timeline list rows — flat separators only (no card chrome per item).
 */
export const TIMELINE_EVENT_ROW_CLASS =
  "border-b border-border/50 py-3 text-sm last:border-b-0 dark:border-border/60";

/** Category label on the right. */
export const TIMELINE_CATEGORY_LABEL_CLASS =
  "shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground";

/**
 * Timeline rows already show `created_by_name` / role below the title.
 * Strip redundant attribution suffixes from stored `event_description` strings.
 */
export function timelineDescriptionWithoutTrailingAttribution(
  description: string,
  createdByName: string | null | undefined
): string {
  const name = createdByName?.trim();
  if (!name) return description;
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let s = description.replace(new RegExp(`\\s+by\\s+${esc}\\s*$`, "i"), "");
  s = s.replace(new RegExp(`\\s*\\(${esc}\\)\\s*$`, "i"), "");
  return s.trimEnd();
}
