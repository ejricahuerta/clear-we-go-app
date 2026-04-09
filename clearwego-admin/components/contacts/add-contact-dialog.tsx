"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CONTACT_TYPES = ["estate_lawyer", "realtor", "property_manager", "other"] as const;
const FOUND_VIA = ["apollo", "linkedin", "realtor_ca", "lsoo", "referral", "other"] as const;

function formatOptionLabel(key: string) {
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

const initialForm = {
  first_name: "",
  last_name: "",
  company: "",
  email: "",
  phone: "",
  neighbourhood: "",
  type: "other" as (typeof CONTACT_TYPES)[number],
  found_via: "apollo" as (typeof FOUND_VIA)[number],
};

export function AddContactDialog({ open, onOpenChange, onSuccess }: Props) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setForm(initialForm);
      setError(null);
      setIsSubmitting(false);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const first = form.first_name.trim();
    if (!first) {
      setError("First name is required.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: first,
          last_name: form.last_name.trim(),
          company: form.company.trim() || undefined,
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          neighbourhood: form.neighbourhood.trim() || undefined,
          type: form.type,
          found_via: form.found_via,
        }),
      });
      const data: { error?: string } = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Something went wrong");
        return;
      }
      onSuccess();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add contact</DialogTitle>
            <DialogDescription>
              Add one contact to your outreach list. New contacts start with status New.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="add-contact-first">First name</Label>
                <Input
                  id="add-contact-first"
                  value={form.first_name}
                  onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                  autoComplete="given-name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-contact-last">Last name</Label>
                <Input
                  id="add-contact-last"
                  value={form.last_name}
                  onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                  autoComplete="family-name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-contact-company">Company</Label>
              <Input
                id="add-contact-company"
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                autoComplete="organization"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="add-contact-email">Email</Label>
                <Input
                  id="add-contact-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-contact-phone">Phone</Label>
                <Input
                  id="add-contact-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  autoComplete="tel"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-contact-neighbourhood">Neighbourhood</Label>
              <Input
                id="add-contact-neighbourhood"
                value={form.neighbourhood}
                onChange={(e) => setForm((f) => ({ ...f, neighbourhood: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="add-contact-type">Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, type: v as (typeof CONTACT_TYPES)[number] }))
                  }
                >
                  <SelectTrigger id="add-contact-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTACT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {formatOptionLabel(t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-contact-found-via">Found via</Label>
                <Select
                  value={form.found_via}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, found_via: v as (typeof FOUND_VIA)[number] }))
                  }
                >
                  <SelectTrigger id="add-contact-found-via" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FOUND_VIA.map((v) => (
                      <SelectItem key={v} value={v}>
                        {formatOptionLabel(v)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Add contact"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
