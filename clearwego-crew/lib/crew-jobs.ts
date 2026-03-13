/** Service type display labels for crew app. */
export const SERVICE_TYPE_LABELS: Record<string, string> = {
  estate_cleanout: "Estate cleanout",
  presale_clearout: "Pre-sale clearout",
  tenant_moveout: "Tenant move-out",
  downsizing: "Downsizing",
};

/** Access type display labels. */
export const ACCESS_TYPE_LABELS: Record<string, string> = {
  key: "Key",
  lockbox: "Lockbox",
  owner_present: "Owner present",
  realtor_lockbox: "Realtor lockbox",
  building_fob: "Building fob",
};

export function formatServiceType(serviceType: string): string {
  return SERVICE_TYPE_LABELS[serviceType] ?? serviceType.replace(/_/g, " ");
}

/** Format time string (HH:mm or HH:mm:ss) to e.g. "9:00 AM". */
export function formatTime(timeStr: string | null | undefined): string {
  if (!timeStr) return "—";
  const part = timeStr.slice(0, 5);
  const [h, m] = part.split(":").map(Number);
  if (Number.isNaN(h)) return "—";
  const hour = h % 12 || 12;
  const ampm = h < 12 ? "AM" : "PM";
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

/** Format date string (YYYY-MM-DD) to e.g. "Thursday, Mar 14". */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T12:00:00");
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-CA", { weekday: "long", month: "short", day: "numeric" });
}

/** Format date for "Next job" subtitle: "Thu, Mar 14 – Estate cleanout". */
export function formatNextJobDate(dateStr: string | null | undefined, serviceType: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  if (Number.isNaN(d.getTime())) return "";
  const datePart = d.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" });
  return `${datePart} – ${formatServiceType(serviceType)}`;
}
