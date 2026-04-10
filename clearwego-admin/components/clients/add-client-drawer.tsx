"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Search } from "lucide-react";

const CONTACT_TYPES = ["estate_lawyer", "realtor", "property_manager", "other"] as const;
const FOUND_VIA = ["apollo", "linkedin", "realtor_ca", "lsoo", "quo", "referral", "other"] as const;

const CLIENT_TYPES = [
  { value: "executor", label: "Executor" },
  { value: "estate_lawyer", label: "Estate lawyer" },
  { value: "realtor", label: "Realtor" },
  { value: "property_manager", label: "Property manager" },
  { value: "family", label: "Family" },
  { value: "other", label: "Other" },
];

function formatOptionLabel(key: string) {
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function contactListLabel(c: ListContact) {
  const name = `${c.first_name} ${c.last_name}`.trim() || "Unnamed";
  const detail = c.email?.trim() || c.phone?.trim() || c.company?.trim() || "—";
  return `${name} · ${detail}`;
}

type Candidate = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
};

type ListContact = {
  id: string;
  first_name: string;
  last_name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
};

function ContactSearchCombobox({
  disabled,
  selectedId,
  selectedLabel,
  onSelect,
}: {
  disabled?: boolean;
  selectedId: string;
  selectedLabel: string;
  onSelect: (c: ListContact) => void;
}) {
  const [comboOpen, setComboOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<ListContact[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!comboOpen) return;
    let cancelled = false;
    setLoading(true);
    const q = search.trim();
    const delayMs = q === "" ? 0 : 300;
    const t = window.setTimeout(() => {
      const params = new URLSearchParams({
        view: "all",
        page: "1",
        pageSize: "50",
        sort: "first_name",
        order: "asc",
      });
      if (q) params.set("search", q);
      fetch(`/api/contacts?${params}`)
        .then((r) => r.json())
        .then((data) => {
          if (cancelled) return;
          if (data.error) {
            setItems([]);
            return;
          }
          setItems(data.contacts ?? []);
        })
        .catch(() => {
          if (!cancelled) setItems([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, delayMs);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [comboOpen, search]);

  return (
    <Popover
      open={comboOpen}
      onOpenChange={(next) => {
        setComboOpen(next);
        if (next) setSearch("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={comboOpen}
          disabled={disabled}
          className="min-w-0 flex-1 justify-between font-normal"
          id="add-client-contact-combo"
        >
          <span className="truncate text-left">{selectedLabel || "Search or select contact…"}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(calc(100vw-2rem),20rem)] p-0" align="start">
        <div className="flex items-center border-b px-2">
          <Search className="mx-1 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <input
            className="flex h-10 w-full bg-transparent py-2 pl-1 pr-2 text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Search name, email, company…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
        <div className="max-h-[min(260px,40vh)] overflow-y-auto p-1">
          {loading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Searching…</p>
          ) : items.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No contacts found</p>
          ) : (
            items.map((c) => (
              <button
                key={c.id}
                type="button"
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                  selectedId === c.id && "bg-accent"
                )}
                onClick={() => {
                  onSelect(c);
                  setComboOpen(false);
                }}
              >
                <Check
                  className={cn("h-4 w-4 shrink-0", selectedId === c.id ? "opacity-100" : "opacity-0")}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate">{contactListLabel(c)}</span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
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
  address: "",
  type: "other" as (typeof CONTACT_TYPES)[number],
  found_via: "apollo" as (typeof FOUND_VIA)[number],
  client_type: "" as string,
  referral_source: "",
  sms_opted_out: false,
  google_review_received: false,
  notes: "",
};

function buildNewContactPayload(form: typeof initialForm) {
  const first = form.first_name.trim();
  const payload: Record<string, unknown> = {
    first_name: first,
    last_name: form.last_name.trim(),
    company: form.company.trim() || undefined,
    email: form.email.trim() || null,
    phone: form.phone.trim() || null,
    neighbourhood: form.neighbourhood.trim() || null,
    address: form.address.trim() || null,
    type: form.type,
    found_via: form.found_via,
    sms_opted_out: form.sms_opted_out,
    google_review_received: form.google_review_received,
    notes: form.notes.trim() || null,
  };
  if (form.client_type.trim()) {
    payload.client_type = form.client_type.trim();
  }
  if (form.referral_source.trim()) {
    payload.referral_source = form.referral_source.trim();
  }
  return payload;
}

function buildExistingContactPayload(form: typeof initialForm, contactId: string) {
  const p: Record<string, unknown> = {
    existing_contact_id: contactId,
    address: form.address.trim() || null,
    sms_opted_out: form.sms_opted_out,
    google_review_received: form.google_review_received,
    notes: form.notes.trim() || null,
  };
  if (form.client_type.trim()) {
    p.client_type = form.client_type.trim();
  }
  if (form.referral_source.trim()) {
    p.referral_source = form.referral_source.trim();
  }
  return p;
}

export function AddClientDrawer({ open, onOpenChange, onSuccess }: Props) {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [pendingPayload, setPendingPayload] = useState<Record<string, unknown> | null>(null);

  const [contactSource, setContactSource] = useState<"pick" | "new">("pick");
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [selectedContactLabel, setSelectedContactLabel] = useState<string>("");

  useEffect(() => {
    if (!open) {
      setForm(initialForm);
      setError(null);
      setIsSubmitting(false);
      setStep("form");
      setCandidates([]);
      setPendingPayload(null);
      setContactSource("pick");
      setSelectedContactId("");
      setSelectedContactLabel("");
    }
  }, [open]);

  async function postClient(body: Record<string, unknown>) {
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(typeof data.error === "string" ? data.error : "Request failed");
    }
    return data as { needsConfirmation?: boolean; candidates?: Candidate[]; clientId?: string; ok?: boolean };
  }

  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (contactSource === "pick") {
      if (!selectedContactId) {
        setError("Search and select a contact, or click Add new to enter contact details.");
        return;
      }
      setIsSubmitting(true);
      try {
        const payload = buildExistingContactPayload(form, selectedContactId);
        const data = await postClient(payload);
        if (data.clientId) {
          onSuccess();
          onOpenChange(false);
          router.push(`/clients/${data.clientId}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const first = form.first_name.trim();
    if (!first) {
      setError("First name is required.");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = buildNewContactPayload(form);
      const data = await postClient(payload);
      if (data.needsConfirmation && data.candidates?.length) {
        setPendingPayload(payload);
        setCandidates(data.candidates);
        setStep("confirm");
        return;
      }
      if (data.clientId) {
        onSuccess();
        onOpenChange(false);
        router.push(`/clients/${data.clientId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function chooseSamePerson(contactId: string) {
    if (!pendingPayload) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const data = await postClient({
        ...pendingPayload,
        existing_contact_id: contactId,
      });
      if (data.clientId) {
        onSuccess();
        onOpenChange(false);
        router.push(`/clients/${data.clientId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function chooseDifferentPerson() {
    if (!pendingPayload) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const data = await postClient({
        ...pendingPayload,
        force_new_contact: true,
      });
      if (data.clientId) {
        onSuccess();
        onOpenChange(false);
        router.push(`/clients/${data.clientId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        {step === "form" ? (
          <form onSubmit={handleSubmitForm} className="flex min-h-0 flex-1 flex-col">
            <SheetHeader className="shrink-0 space-y-1 border-b px-6 pb-4 pt-2 text-left">
              <SheetTitle>Add client</SheetTitle>
              <SheetDescription>
                Choose someone already in contacts, or add a new contact—then we create their client profile.
              </SheetDescription>
            </SheetHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              <div className="grid gap-4">
                {error ? (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                ) : null}

                <div className="space-y-2">
                  <Label id="add-client-contact-label">Contact</Label>
                  <div className="flex gap-2">
                    <ContactSearchCombobox
                      disabled={contactSource === "new"}
                      selectedId={selectedContactId}
                      selectedLabel={selectedContactLabel}
                      onSelect={(c) => {
                        setSelectedContactId(c.id);
                        setSelectedContactLabel(contactListLabel(c));
                        setContactSource("pick");
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="shrink-0"
                      onClick={() => {
                        if (contactSource === "new") {
                          setContactSource("pick");
                          setSelectedContactId("");
                          setSelectedContactLabel("");
                          setForm((f) => ({
                            ...f,
                            first_name: "",
                            last_name: "",
                            company: "",
                            email: "",
                            phone: "",
                            neighbourhood: "",
                            type: "other",
                            found_via: "apollo",
                          }));
                        } else {
                          setContactSource("new");
                          setSelectedContactId("");
                          setSelectedContactLabel("");
                        }
                      }}
                    >
                      {contactSource === "new" ? "Select contact" : "Add new"}
                    </Button>
                  </div>
                </div>

                {contactSource === "new" ? (
                  <div className="grid gap-4 border-l-2 border-border pl-3">
                    <p className="text-sm font-medium text-foreground">New contact details</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="add-client-first">First name</Label>
                        <Input
                          id="add-client-first"
                          value={form.first_name}
                          onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                          autoComplete="given-name"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="add-client-last">Last name</Label>
                        <Input
                          id="add-client-last"
                          value={form.last_name}
                          onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                          autoComplete="family-name"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="add-client-company">Company</Label>
                      <Input
                        id="add-client-company"
                        value={form.company}
                        onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                        autoComplete="organization"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="add-client-email">Email</Label>
                        <Input
                          id="add-client-email"
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                          autoComplete="email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="add-client-phone">Phone</Label>
                        <Input
                          id="add-client-phone"
                          type="tel"
                          value={form.phone}
                          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                          autoComplete="tel"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="add-client-neighbourhood">Neighbourhood</Label>
                      <Input
                        id="add-client-neighbourhood"
                        value={form.neighbourhood}
                        onChange={(e) => setForm((f) => ({ ...f, neighbourhood: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="add-client-type">Contact type</Label>
                        <Select
                          value={form.type}
                          onValueChange={(v) => setForm((f) => ({ ...f, type: v as (typeof CONTACT_TYPES)[number] }))}
                        >
                          <SelectTrigger id="add-client-type" className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent position="popper" className="z-[60]">
                            {CONTACT_TYPES.map((t) => (
                              <SelectItem key={t} value={t}>
                                {formatOptionLabel(t)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="add-client-found-via">Found via</Label>
                        <Select
                          value={form.found_via}
                          onValueChange={(v) =>
                            setForm((f) => ({ ...f, found_via: v as (typeof FOUND_VIA)[number] }))
                          }
                        >
                          <SelectTrigger id="add-client-found-via" className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent position="popper" className="z-[60]">
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
                ) : null}

                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Client profile</p>
                  <Label htmlFor="add-client-address">Address</Label>
                  <Input
                    id="add-client-address"
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    autoComplete="street-address"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Client type</Label>
                  <Select
                    value={form.client_type || "__empty__"}
                    onValueChange={(v) => setForm((f) => ({ ...f, client_type: v === "__empty__" ? "" : v }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="-" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="z-[60]">
                      <SelectItem value="__empty__">-</SelectItem>
                      {CLIENT_TYPES.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-client-referral">Referral source (optional)</Label>
                  <Input
                    id="add-client-referral"
                    value={form.referral_source}
                    onChange={(e) => setForm((f) => ({ ...f, referral_source: e.target.value }))}
                    placeholder="Overrides “found via” on the client if set"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="add-client-sms"
                      checked={form.sms_opted_out}
                      onCheckedChange={(checked) => setForm((f) => ({ ...f, sms_opted_out: !!checked }))}
                    />
                    <Label htmlFor="add-client-sms" className="font-normal">
                      SMS opted out
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="add-client-review"
                      checked={form.google_review_received}
                      onCheckedChange={(checked) => setForm((f) => ({ ...f, google_review_received: !!checked }))}
                    />
                    <Label htmlFor="add-client-review" className="font-normal">
                      Google review received
                    </Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-client-notes">Notes</Label>
                  <Textarea
                    id="add-client-notes"
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <SheetFooter className="shrink-0 gap-2 border-t bg-background px-6 py-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : "Add client"}
              </Button>
            </SheetFooter>
          </form>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <SheetHeader className="shrink-0 space-y-1 border-b px-6 pb-4 pt-2 text-left">
              <SheetTitle>Matching contact</SheetTitle>
              <SheetDescription>
                We found existing contacts with the same email or phone. Is one of them the same person?
              </SheetDescription>
            </SheetHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              <div className="grid gap-4">
                {error ? (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                ) : null}
                <ul className="space-y-3">
                  {candidates.map((c) => (
                    <li
                      key={c.id}
                      className="flex flex-col gap-2 rounded-lg border border-border/80 bg-muted/30 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium">
                          {c.first_name} {c.last_name}
                        </p>
                        <p className="text-muted-foreground">{c.email ?? "—"}</p>
                        <p className="text-muted-foreground">{c.phone ?? "—"}</p>
                      </div>
                      <Button type="button" size="sm" disabled={isSubmitting} onClick={() => chooseSamePerson(c.id)}>
                        Same person
                      </Button>
                    </li>
                  ))}
                </ul>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={isSubmitting}
                  onClick={chooseDifferentPerson}
                >
                  No — create a new contact
                </Button>
              </div>
            </div>
            <SheetFooter className="shrink-0 border-t bg-background px-6 py-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setStep("form");
                  setCandidates([]);
                  setPendingPayload(null);
                }}
                disabled={isSubmitting}
              >
                Back
              </Button>
            </SheetFooter>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
