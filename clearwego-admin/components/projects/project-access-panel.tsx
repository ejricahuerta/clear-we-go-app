"use client";

import type { LucideIcon } from "lucide-react";
import { Calendar, Eye, EyeOff, Home, KeyRound, MapPin, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DateTimePickerField } from "@/components/ui/date-time-picker-fields";
import { cn } from "@/lib/utils";

type Access = Record<string, unknown>;

function PropRow({
  icon: Icon,
  label,
  children,
  className,
  rowAlign = "center",
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
  className?: string;
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
      <Icon
        className={cn(
          "size-4 shrink-0 text-muted-foreground",
          rowAlign === "start" ? "mt-0.5" : "self-center"
        )}
        aria-hidden
      />
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-row gap-3",
          rowAlign === "start" ? "items-start" : "items-center"
        )}
      >
        <p className="w-[38%] min-w-[6.75rem] max-w-[11rem] shrink-0 text-[11px] font-medium uppercase leading-snug tracking-wide text-muted-foreground">
          {label}
        </p>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

type Props = {
  idPrefix: string;
  access: Access;
  setAccess: React.Dispatch<React.SetStateAction<Access>>;
  accessTypes: { value: string; label: string }[];
  lockboxVisible: boolean;
  setLockboxVisible: React.Dispatch<React.SetStateAction<boolean>>;
};

export function ProjectAccessPanel({
  idPrefix,
  access,
  setAccess,
  accessTypes,
  lockboxVisible,
  setLockboxVisible,
}: Props) {
  const p = (s: string) => `${idPrefix}-${s}`;
  const fieldShell =
    "rounded-md border border-border/25 bg-muted/35 px-2.5 py-1 shadow-none transition-colors hover:bg-muted/50 focus-visible:border-input/70 focus-visible:bg-background/90";

  return (
    <div className="space-y-0 px-1">
      <PropRow icon={KeyRound} label="Access type">
        <Select
          value={(access.access_type as string) ?? "__empty__"}
          onValueChange={(v) => setAccess((a) => ({ ...a, access_type: v === "__empty__" ? null : v }))}
        >
          <SelectTrigger id={p("access_type")} className={cn(fieldShell, "h-9 w-full")}>
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__empty__">—</SelectItem>
            {accessTypes.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PropRow>

      <PropRow icon={User} label="Received from">
        <Input
          id={p("received_from")}
          className={cn(fieldShell, "h-9 border-0 focus-visible:ring-0")}
          value={(access.received_from as string) ?? ""}
          onChange={(e) => setAccess((a) => ({ ...a, received_from: e.target.value }))}
        />
      </PropRow>

      <PropRow icon={Calendar} label="Received date">
        <DateTimePickerField
          id={p("received_date")}
          value={(access.received_date as string | null) ?? null}
          onChange={(iso) => setAccess((a) => ({ ...a, received_date: iso }))}
          className={cn(
            fieldShell,
            "h-9 border-0 bg-muted/35 shadow-none hover:bg-muted/50 focus-visible:border-input/70 focus-visible:bg-background/90 focus-visible:ring-1 focus-visible:ring-ring/50"
          )}
        />
      </PropRow>

      <PropRow icon={Home} label="Lockbox code">
        <div className="relative">
          <Input
            type={lockboxVisible ? "text" : "password"}
            id={p("lockbox_code")}
            className={cn(fieldShell, "h-9 border-0 pr-10 focus-visible:ring-0")}
            value={(access.lockbox_code as string) ?? ""}
            onChange={(e) => setAccess((a) => ({ ...a, lockbox_code: e.target.value }))}
            placeholder="Code"
            autoComplete="off"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground"
            onClick={() => setLockboxVisible((v) => !v)}
            aria-label={lockboxVisible ? "Hide code" : "Show code"}
          >
            {lockboxVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </PropRow>

      <PropRow icon={MapPin} label="Building notes" rowAlign="start">
        <Textarea
          id={p("building_instructions")}
          className={cn(fieldShell, "min-h-[4.5rem] resize-y border-0 py-2 focus-visible:ring-0")}
          value={(access.building_instructions as string) ?? ""}
          onChange={(e) => setAccess((a) => ({ ...a, building_instructions: e.target.value }))}
          rows={2}
        />
      </PropRow>

      <PropRow icon={MapPin} label="Parking">
        <Input
          id={p("parking_instructions")}
          className={cn(fieldShell, "h-9 border-0 focus-visible:ring-0")}
          value={(access.parking_instructions as string) ?? ""}
          onChange={(e) => setAccess((a) => ({ ...a, parking_instructions: e.target.value }))}
        />
      </PropRow>

      <PropRow icon={KeyRound} label="Key returned to">
        <Input
          id={p("key_returned_to")}
          className={cn(fieldShell, "h-9 border-0 focus-visible:ring-0")}
          value={(access.key_returned_to as string) ?? ""}
          onChange={(e) => setAccess((a) => ({ ...a, key_returned_to: e.target.value }))}
        />
      </PropRow>

      <PropRow icon={Calendar} label="Key returned">
        <DateTimePickerField
          id={p("key_returned_date")}
          value={(access.key_returned_date as string | null) ?? null}
          onChange={(iso) => setAccess((a) => ({ ...a, key_returned_date: iso }))}
          className={cn(
            fieldShell,
            "h-9 border-0 bg-muted/35 shadow-none hover:bg-muted/50 focus-visible:border-input/70 focus-visible:bg-background/90 focus-visible:ring-1 focus-visible:ring-ring/50"
          )}
        />
      </PropRow>
    </div>
  );
}
