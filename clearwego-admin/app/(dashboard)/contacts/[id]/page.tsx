"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
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
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

type Contact = {
  id: string;
  first_name: string;
  last_name: string;
  company: string | null;
  type: string | null;
  email: string | null;
  phone: string | null;
  neighbourhood: string | null;
  found_via: string | null;
  status: string;
  email_1_sent: boolean;
  email_1_date: string | null;
  email_2_sent: boolean;
  email_2_date: string | null;
  email_3_sent: boolean;
  email_3_date: string | null;
  response_received: boolean;
  response_notes: string | null;
  last_contacted_date: string | null;
  follow_up_date: string | null;
  converted_to_client: boolean;
  client_id: string | null;
  notes: string | null;
  created_at: string;
};

const TYPE_OPTIONS = [
  { value: "estate_lawyer", label: "Estate lawyer" },
  { value: "realtor", label: "Realtor" },
  { value: "property_manager", label: "Property manager" },
  { value: "other", label: "Other" },
];

const FOUND_VIA_OPTIONS = [
  { value: "apollo", label: "Apollo" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "realtor_ca", label: "Realtor.ca" },
  { value: "lsoo", label: "LSOO" },
  { value: "referral", label: "Referral" },
  { value: "other", label: "Other" },
];

const STATUS_OPTIONS = ["new", "contacted", "responded", "converted", "dead"];
const STATUS_LABEL: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  responded: "Responded",
  converted: "Converted",
  dead: "Closed",
};

export default function ContactProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [contact, setContact] = useState<Contact | null>(null);
  const [form, setForm] = useState<Partial<Contact>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logEmailNum, setLogEmailNum] = useState<number | null>(null);
  const [convertOpen, setConvertOpen] = useState(false);
  const [converting, setConverting] = useState(false);
  const [markDeadLoading, setMarkDeadLoading] = useState(false);
  const [logOutreachOpen, setLogOutreachOpen] = useState(false);
  const [markDeadOpen, setMarkDeadOpen] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/contacts/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setContact(data);
        setForm({
          first_name: data.first_name,
          last_name: data.last_name,
          company: data.company,
          type: data.type,
          email: data.email,
          phone: data.phone,
          neighbourhood: data.neighbourhood,
          found_via: data.found_via,
          status: data.status,
          response_received: data.response_received,
          response_notes: data.response_notes,
          notes: data.notes,
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => load(), [load]);

  const handleSave = () => {
    setSaving(true);
    setError(null);
    fetch(`/api/contacts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setContact(data);
        setForm((f) => ({ ...f, ...data }));
      })
      .catch((e) => setError(e.message))
      .finally(() => setSaving(false));
  };

  const handleLogOutreach = (emailNum: number) => {
    setLogOutreachOpen(false);
    setLogEmailNum(emailNum);
    fetch("/api/contacts/log-outreach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId: id, emailNumber: emailNum }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        load();
      })
      .catch((e) => setError(e.message))
      .finally(() => setLogEmailNum(null));
  };

  const handleConvert = () => {
    setConverting(true);
    fetch("/api/contacts/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId: id }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setConvertOpen(false);
        if (data.clientId) router.push(`/clients/${data.clientId}`);
      })
      .catch((e) => setError(e.message))
      .finally(() => setConverting(false));
  };

  const handleMarkDead = () => {
    setMarkDeadLoading(true);
    fetch(`/api/contacts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "dead" }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setMarkDeadOpen(false);
        setContact(data);
        setForm((f) => ({ ...f, status: "dead" }));
      })
      .catch((e) => setError(e.message))
      .finally(() => setMarkDeadLoading(false));
  };

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-48 rounded-md mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(280px,360px)] gap-6 items-start">
          <div className="min-w-0">
            <Skeleton className="h-80 w-full rounded-xl" />
          </div>
          <div className="space-y-6 lg:sticky lg:top-6">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }
  if (error && !contact) return <div className="p-6 text-destructive">{error}</div>;
  if (!contact) return <div className="p-6">Contact not found.</div>;

  const formatDate = (d: string | null) => (d ? new Date(d).toLocaleString() : "-");

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">{contact.first_name} {contact.last_name}</h1>
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(280px,360px)] gap-6 items-start">
        <div className="min-w-0">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
          <CardDescription>Contact information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First name</Label>
              <Input id="first_name" value={form.first_name ?? ""} onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last name</Label>
              <Input id="last_name" value={form.last_name ?? ""} onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))} />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" value={form.company ?? ""} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value || null }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={form.type ?? "__empty__"} onValueChange={(v) => setForm((f) => ({ ...f, type: v === "__empty__" ? null : v }))}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="-" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__empty__">-</SelectItem>
                  {TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="found_via">Found via</Label>
              <Select value={form.found_via ?? "__empty__"} onValueChange={(v) => setForm((f) => ({ ...f, found_via: v === "__empty__" ? null : v }))}>
                <SelectTrigger id="found_via">
                  <SelectValue placeholder="-" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__empty__">-</SelectItem>
                  {FOUND_VIA_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email ?? ""} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value || null }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone ?? ""} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value || null }))} />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="neighbourhood">Neighbourhood</Label>
              <Input id="neighbourhood" value={form.neighbourhood ?? ""} onChange={(e) => setForm((f) => ({ ...f, neighbourhood: e.target.value || null }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={form.status ?? ""} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABEL[s] ?? s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="response_notes">Response notes</Label>
              <Input id="response_notes" value={form.response_notes ?? ""} onChange={(e) => setForm((f) => ({ ...f, response_notes: e.target.value || null }))} />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={form.notes ?? ""} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value || null }))} rows={3} />
            </div>
          </div>
          <Button onClick={handleSave} loading={saving}>{saving ? "Saving…" : "Save changes"}</Button>
        </CardContent>
      </Card>
        </div>

        <div className="space-y-6 lg:sticky lg:top-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sequence</CardTitle>
              <CardDescription>
                Email 1 {contact.email_1_sent ? `sent ${formatDate(contact.email_1_date)}` : "not sent"} · Email 2 {contact.email_2_sent ? `sent ${formatDate(contact.email_2_date)}` : "not sent"} · Email 3 {contact.email_3_sent ? `sent ${formatDate(contact.email_3_date)}` : "not sent"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" onClick={() => setLogOutreachOpen(true)} loading={logEmailNum !== null}>
                {logEmailNum !== null ? "Logging…" : "Log outreach"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
              <CardDescription>Convert to client or close this contact</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {!contact.converted_to_client && contact.status !== "dead" && (
                <>
                  <Button onClick={() => setConvertOpen(true)}>Convert to client</Button>
                  <Button variant="outline" onClick={() => setMarkDeadOpen(true)}>Mark as closed</Button>
                </>
              )}
              {contact.converted_to_client && contact.client_id && (
                <Link href={`/clients/${contact.client_id}`}>
                  <Button variant="outline">View client</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Convert to client</DialogTitle>
            <DialogDescription>
              A new client profile will be created and linked to this contact. You will be redirected to the client profile.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleConvert} loading={converting}>{converting ? "Converting…" : "Confirm"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={logOutreachOpen} onOpenChange={setLogOutreachOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Log outreach</DialogTitle>
            <DialogDescription>Which email did you send?</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 py-2">
            {([1, 2, 3] as const).map((n) => (
              <Button key={n} variant="outline" onClick={() => handleLogOutreach(n)} disabled={logEmailNum !== null}>
                Email {n}
              </Button>
            ))}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={markDeadOpen} onOpenChange={setMarkDeadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark as closed</DialogTitle>
            <DialogDescription>
              This contact will be marked as closed and removed from active outreach lists.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button variant="destructive" onClick={handleMarkDead} loading={markDeadLoading}>{markDeadLoading ? "Marking…" : "Mark as closed"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
