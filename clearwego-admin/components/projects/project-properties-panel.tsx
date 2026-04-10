"use client";

import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerField, TimePickerField } from "@/components/ui/date-time-picker-fields";
import { isAutoSidebarImportantStage } from "@/lib/projects/stages";
import { cn } from "@/lib/utils";

/** Aligns with project detail `Project` state in the admin app. */
export type ProjectForPropertiesPanel = {
  id: string;
  client_id: string;
  client_name: string | null;
  service_type: string;
  property_size: string | null;
  property_address: string;
  neighbourhood: string | null;
  stage: string;
  walkthrough_date: string | null;
  walkthrough_method: string | null;
  job_date: string | null;
  start_time: string | null;
  quote_amount: number | null;
  deposit_received: boolean;
  deposit_amount: number | null;
  invoice_amount: number | null;
  payment_received: boolean;
  notes: string | null;
  created_at: string;
  archived_at: string | null;
  pinned: boolean;
};

function PropRow({
  label,
  children,
  className,
  rowAlign = "center",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  /** `start`: top-align label and control (e.g. textareas). */
  rowAlign?: "center" | "start";
}) {
  return (
    <div
      className={cn(
        "flex gap-3 border-b border-border/60 py-2.5 last:border-b-0",
        rowAlign === "start" ? "items-start" : "items-center",
        className
      )}
    >
      <p className="w-[38%] min-w-[6.75rem] max-w-[11rem] shrink-0 text-[11px] font-medium uppercase leading-snug tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

type Props = {
  idPrefix: string;
  project: ProjectForPropertiesPanel;
  setProject: React.Dispatch<React.SetStateAction<ProjectForPropertiesPanel | null>>;
  serviceLabel: (s: string | null) => string;
  stages: string[];
  stageLabels: Record<string, string>;
  onStageChange: (stage: string) => void;
  fieldsDisabled?: boolean;
  /** Owner/admin: toggle “important” sidebar pin. */
  canManagePinned?: boolean;
};

export function ProjectPropertiesPanel({
  idPrefix,
  project,
  setProject,
  serviceLabel,
  stages,
  stageLabels,
  onStageChange,
  fieldsDisabled = false,
  canManagePinned = false,
}: Props) {
  const p = (s: string) => `${idPrefix}-${s}`;
  const autoSidebarImportant = isAutoSidebarImportantStage(project.stage);

  const fieldShell =
    "rounded-md border border-border/25 bg-muted/35 px-2.5 py-1 shadow-none transition-colors hover:bg-muted/50 focus-visible:border-input/70 focus-visible:bg-background/90";

  return (
    <div className="flex flex-col">
      <div className="space-y-0 px-1">
        <PropRow label="Status">
          <Select value={project.stage} onValueChange={onStageChange} disabled={fieldsDisabled}>
            <SelectTrigger id={p("stage")} className={cn(fieldShell, "h-9 w-full")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {stages.map((s) => (
                <SelectItem key={s} value={s}>
                  {stageLabels[s] ?? s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PropRow>

        <PropRow label="Client">
          <Link
            href={`/clients/${project.client_id}`}
            className="inline-flex min-h-9 items-center text-sm font-medium text-primary hover:underline"
          >
            {project.client_name ?? "View client"}
          </Link>
        </PropRow>

        {canManagePinned ? (
          <PropRow label="Sidebar" rowAlign="start">
            <div className="flex gap-2.5 pt-0.5">
              <Checkbox
                id={p("pinned")}
                checked={project.pinned || autoSidebarImportant}
                disabled={fieldsDisabled || autoSidebarImportant}
                onCheckedChange={(v) =>
                  setProject((prev) => (prev ? { ...prev, pinned: v === true } : prev))
                }
              />
              <label
                htmlFor={p("pinned")}
                className={cn(
                  "text-sm leading-snug text-foreground",
                  autoSidebarImportant ? "cursor-default" : "cursor-pointer"
                )}
              >
                Pin as important
                <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                  {autoSidebarImportant
                    ? "In-progress jobs always appear under Important on the sidebar."
                    : "Shows under Important on the main sidebar while the job is active."}
                </span>
              </label>
            </div>
          </PropRow>
        ) : null}

        <PropRow label="Service">
          <p className="flex min-h-9 items-center text-sm font-medium">{serviceLabel(project.service_type)}</p>
        </PropRow>

        <PropRow label="Property address">
          <Input
            id={p("property_address")}
            className={cn(fieldShell, "h-9 border-0 focus-visible:ring-0")}
            disabled={fieldsDisabled}
            value={project.property_address}
            onChange={(e) => setProject((prev) => (prev ? { ...prev, property_address: e.target.value } : prev))}
          />
        </PropRow>

        <PropRow label="Neighbourhood">
          <Input
            id={p("neighbourhood")}
            className={cn(fieldShell, "h-9 border-0 focus-visible:ring-0")}
            disabled={fieldsDisabled}
            value={project.neighbourhood ?? ""}
            onChange={(e) => setProject((prev) => (prev ? { ...prev, neighbourhood: e.target.value || null } : prev))}
          />
        </PropRow>

        <PropRow label="Property size">
          <Select
            value={project.property_size ?? "__empty__"}
            disabled={fieldsDisabled}
            onValueChange={(v) =>
              setProject((prev) => (prev ? { ...prev, property_size: v === "__empty__" ? null : v } : prev))
            }
          >
            <SelectTrigger id={p("property_size")} className={cn(fieldShell, "h-9 w-full")}>
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__empty__">—</SelectItem>
              <SelectItem value="basement">Basement</SelectItem>
              <SelectItem value="half_house">Half house</SelectItem>
              <SelectItem value="full_house">Full house</SelectItem>
              <SelectItem value="full_estate">Full estate</SelectItem>
            </SelectContent>
          </Select>
        </PropRow>

        <PropRow label="Job date">
          <DatePickerField
            id={p("job_date")}
            value={project.job_date}
            disabled={fieldsDisabled}
            onChange={(v) => setProject((prev) => (prev ? { ...prev, job_date: v } : prev))}
            className={cn(
              fieldShell,
              "h-9 border-0 bg-muted/35 shadow-none hover:bg-muted/50 focus-visible:border-input/70 focus-visible:bg-background/90 focus-visible:ring-1 focus-visible:ring-ring/50"
            )}
          />
        </PropRow>

        <PropRow label="Start time">
          <TimePickerField
            id={p("start_time")}
            value={project.start_time}
            disabled={fieldsDisabled}
            onChange={(v) => setProject((prev) => (prev ? { ...prev, start_time: v } : prev))}
            className={cn(
              fieldShell,
              "h-9 border-0 bg-muted/35 shadow-none hover:bg-muted/50 focus-visible:border-input/70 focus-visible:bg-background/90 focus-visible:ring-1 focus-visible:ring-ring/50"
            )}
          />
        </PropRow>

        <PropRow label="Quote">
          <Input
            type="number"
            step="0.01"
            id={p("quote_amount")}
            className={cn(fieldShell, "h-9 border-0 tabular-nums focus-visible:ring-0")}
            disabled={fieldsDisabled}
            value={project.quote_amount ?? ""}
            onChange={(e) =>
              setProject((prev) =>
                prev ? { ...prev, quote_amount: e.target.value ? parseFloat(e.target.value) : null } : prev
              )
            }
          />
        </PropRow>

        <PropRow label="Invoice">
          <Input
            type="number"
            step="0.01"
            id={p("invoice_amount")}
            className={cn(fieldShell, "h-9 border-0 tabular-nums focus-visible:ring-0")}
            disabled={fieldsDisabled}
            value={project.invoice_amount ?? ""}
            onChange={(e) =>
              setProject((prev) =>
                prev ? { ...prev, invoice_amount: e.target.value ? parseFloat(e.target.value) : null } : prev
              )
            }
          />
        </PropRow>
      </div>
    </div>
  );
}
