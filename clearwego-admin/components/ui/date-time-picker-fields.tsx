"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function parseYmdLocal(ymd: string): Date | undefined {
  const parts = ymd.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return undefined;
  const [y, m, d] = parts;
  return new Date(y, m - 1, d);
}

function isoToCalendarDate(iso: string): Date | undefined {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isoToTimeStr(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "00:00";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function localDateAndTimeToIso(date: Date, timeStr: string): string {
  const [hRaw, mRaw] = timeStr.split(":");
  const h = parseInt(hRaw ?? "0", 10);
  const m = parseInt(mRaw ?? "0", 10);
  const out = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    Number.isFinite(h) ? h : 0,
    Number.isFinite(m) ? m : 0,
    0,
    0
  );
  return out.toISOString();
}

const triggerBase =
  "h-9 w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground";

type DatePickerFieldProps = {
  id?: string;
  value: string | null;
  onChange: (next: string | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

/** `value` / `onChange` use `YYYY-MM-DD` (same as `<input type="date">`). */
export function DatePickerField({
  id,
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  disabled = false,
}: DatePickerFieldProps) {
  const [open, setOpen] = React.useState(false);
  const selected = value ? parseYmdLocal(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          id={id}
          data-empty={!value}
          disabled={disabled}
          className={cn(triggerBase, className)}
        >
          <CalendarIcon className="mr-2 size-4 shrink-0 opacity-70" aria-hidden />
          {selected ? (
            <span className="truncate">{format(selected, "PPP")}</span>
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={(d) => {
            onChange(d ? format(d, "yyyy-MM-dd") : null);
            setOpen(false);
          }}
        />
        {value ? (
          <div className="border-t border-border p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
            >
              Clear date
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

type DateTimePickerFieldProps = {
  id?: string;
  value: string | null;
  onChange: (next: string | null) => void;
  placeholder?: string;
  className?: string;
};

/** `value` / `onChange` use ISO strings (same as previous `datetime-local` + `toISOString()` flow). */
export function DateTimePickerField({
  id,
  value,
  onChange,
  placeholder = "Pick date & time",
  className,
}: DateTimePickerFieldProps) {
  const uid = React.useId();
  const timeInputId = id ? `${id}-time` : `${uid}-time`;
  const [open, setOpen] = React.useState(false);
  const selectedDate = value ? isoToCalendarDate(value) : undefined;
  const [timeStr, setTimeStr] = React.useState(() => (value ? isoToTimeStr(value) : "12:00"));

  React.useEffect(() => {
    if (value) setTimeStr(isoToTimeStr(value));
  }, [value]);

  const displayLabel =
    value && selectedDate
      ? `${format(selectedDate, "PPP")} · ${timeStr}`
      : null;

  const commit = (date: Date | undefined, time: string) => {
    if (!date) {
      onChange(null);
      return;
    }
    onChange(localDateAndTimeToIso(date, time));
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next && value) setTimeStr(isoToTimeStr(value));
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          id={id}
          data-empty={!value}
          className={cn(triggerBase, className)}
        >
          <CalendarIcon className="mr-2 size-4 shrink-0 opacity-70" aria-hidden />
          {displayLabel ? (
            <span className="truncate">{displayLabel}</span>
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          defaultMonth={selectedDate ?? new Date()}
          onSelect={(d) => {
            if (d) commit(d, timeStr);
            else onChange(null);
          }}
        />
        <div className="space-y-2 border-t border-border p-3">
          <Label htmlFor={timeInputId} className="text-xs text-muted-foreground">
            Time
          </Label>
          <Input
            id={timeInputId}
            type="time"
            value={timeStr}
            onChange={(e) => {
              const next = e.target.value || "00:00";
              setTimeStr(next);
              if (selectedDate) commit(selectedDate, next);
            }}
            className="bg-background"
          />
        </div>
        <div className="border-t border-border p-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
          >
            Clear
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

type TimePickerFieldProps = {
  id?: string;
  value: string | null;
  onChange: (next: string | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

/** `value` / `onChange` use `HH:mm` (same as `<input type="time">`). */
export function TimePickerField({
  id,
  value,
  onChange,
  placeholder = "Select time",
  className,
  disabled = false,
}: TimePickerFieldProps) {
  const [open, setOpen] = React.useState(false);
  const hhmm = value?.trim() ? value.trim().slice(0, 5) : "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          id={id}
          data-empty={!hhmm}
          disabled={disabled}
          className={cn(triggerBase, className)}
        >
          <Clock className="mr-2 size-4 shrink-0 opacity-70" aria-hidden />
          {hhmm ? (
            <span className="tabular-nums">{hhmm}</span>
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <Input
          type="time"
          value={hhmm}
          onChange={(e) => {
            const next = e.target.value;
            onChange(next || null);
          }}
          className="bg-background"
        />
        {hhmm ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2 w-full text-muted-foreground"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
          >
            Clear
          </Button>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
