/** Sales funnel on `clients.status` (DB CHECK must match). */
export const CLIENT_STATUSES = [
  "inquiry",
  "walkthrough_booked",
  "booked",
  "appointment_maybe",
  "quoted",
  "deposit_received",
  "active",
] as const;

export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  inquiry: "Inquiry",
  walkthrough_booked: "Walk-through booked",
  booked: "Booked",
  appointment_maybe: "Maybe booked appointment",
  quoted: "Quoted",
  deposit_received: "Deposit received",
  active: "Active (project)",
};

export function isClientStatus(s: string): s is ClientStatus {
  return (CLIENT_STATUSES as readonly string[]).includes(s);
}
