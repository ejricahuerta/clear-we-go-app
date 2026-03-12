"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

type Project = {
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
};

const STAGES = [
  "inquiry", "walkthrough_booked", "quoted", "deposit_received",
  "scheduled", "in_progress", "cleared", "report_sent", "review_requested", "closed",
];
const STAGE_LABELS: Record<string, string> = Object.fromEntries(STAGES.map((s) => [s, s.replace(/_/g, " ")]));

const ACCESS_TYPES = [
  { value: "key", label: "Key" },
  { value: "lockbox", label: "Lockbox" },
  { value: "owner_present", label: "Owner present" },
  { value: "realtor_lockbox", label: "Realtor lockbox" },
  { value: "building_fob", label: "Building fob" },
];

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [access, setAccess] = useState<Record<string, unknown>>({});
  const [crewData, setCrewData] = useState<{
    crew: { id: string; name: string; email: string }[];
    available: { id: string; name: string; email: string }[];
    all: { id: string; name: string; email: string; assigned: boolean }[];
  } | null>(null);
  const [selectedCrewIds, setSelectedCrewIds] = useState<Set<string>>(new Set());
  const [crewSaving, setCrewSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stageChanging, setStageChanging] = useState(false);

  const load = useCallback(() => {
    Promise.all([
      fetch(`/api/projects/${id}`).then((r) => r.json()),
      fetch(`/api/projects/${id}/access`).then((r) => r.json()).catch(() => ({ access: null })),
      fetch(`/api/projects/${id}/crew`).then((r) => r.json()).catch(() => ({ crew: [], available: [], all: [] })),
    ])
      .then(([projData, accessData, crewResp]) => {
        if (projData.error) throw new Error(projData.error);
        setProject(projData);
        setAccess(accessData.access ?? {});
        if (crewResp.crew !== undefined) {
          setCrewData({
            crew: crewResp.crew ?? [],
            available: crewResp.available ?? [],
            all: crewResp.all ?? [],
          });
          setSelectedCrewIds(new Set((crewResp.crew ?? []).map((c: { id: string }) => c.id)));
        }
      })
      .catch(() => setProject(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => load(), [load]);

  const handleStageChange = (newStage: string) => {
    setStageChanging(true);
    fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: newStage }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setProject(data);
        load();
      })
      .catch(console.error)
      .finally(() => setStageChanging(false));
  };

  const handleSaveDetails = () => {
    if (!project) return;
    setSaving(true);
    fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(project),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setProject(data);
      })
      .catch(console.error)
      .finally(() => setSaving(false));
  };

  const handleCrewToggle = (userId: string, assigned: boolean) => {
    setSelectedCrewIds((prev) => {
      const next = new Set(prev);
      if (assigned) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleSaveCrew = () => {
    setCrewSaving(true);
    fetch(`/api/projects/${id}/crew`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_ids: Array.from(selectedCrewIds) }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        load();
      })
      .catch(console.error)
      .finally(() => setCrewSaving(false));
  };

  const handleSaveAccess = () => {
    setSaving(true);
    fetch(`/api/projects/${id}/access`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(access),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        load();
      })
      .catch(console.error)
      .finally(() => setSaving(false));
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl space-y-6">
        <Skeleton className="h-8 w-64 rounded-md" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-9 w-full max-w-md rounded-md" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    );
  }
  if (!project) return <div className="p-6">Project not found.</div>;

  const formatDate = (d: string | null) => (d ? new Date(d).toLocaleDateString() : "");
  const formatTime = (t: string | null) => (t ? t.slice(0, 5) : "");
  const formatCurrency = (n: number | null) => (n != null ? new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n) : "-");
  const serviceLabel = (s: string | null) => (s ? s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "-");

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold truncate">{project.property_address}</h1>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Overview</CardTitle>
          <CardDescription>Key details and stage. Edit full fields in the Details tab.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Client</p>
              <p className="font-medium">
                <Link href={`/clients/${project.client_id}`} className="text-primary hover:underline">
                  {project.client_name ?? "-"}
                </Link>
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Service</p>
              <p className="font-medium">{serviceLabel(project.service_type)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Neighbourhood</p>
              <p className="font-medium">{project.neighbourhood ?? "-"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Stage</p>
              <Select
                value={project.stage}
                onValueChange={handleStageChange}
                disabled={stageChanging}
              >
                <SelectTrigger id="stage" className="h-9 w-full max-w-[12rem]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => (
                    <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Job date</p>
              <p className="font-medium">{formatDate(project.job_date) || "-"}{project.start_time ? ` at ${project.start_time.slice(0, 5)}` : ""}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Property size</p>
              <p className="font-medium">{project.property_size ? project.property_size.replace(/_/g, " ") : "-"}</p>
            </div>
          </div>
          <div className="border-t pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Quote</p>
              <p className="font-medium tabular-nums">{formatCurrency(project.quote_amount)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Invoice</p>
              <p className="font-medium tabular-nums">{formatCurrency(project.invoice_amount)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Deposit</p>
              <p className="font-medium">{project.deposit_received ? (project.deposit_amount != null ? formatCurrency(project.deposit_amount) : "Received") : "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Payment</p>
              <p className="font-medium">{project.payment_received ? "Received" : "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="crew">Crew</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Project fields</CardTitle>
              <CardDescription>Address, dates, amounts, and notes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="property_address">Property address</Label>
                  <Input
                    id="property_address"
                    value={project.property_address}
                    onChange={(e) => setProject((p) => (p ? { ...p, property_address: e.target.value } : p))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="neighbourhood">Neighbourhood</Label>
                  <Input
                    id="neighbourhood"
                    value={project.neighbourhood ?? ""}
                    onChange={(e) => setProject((p) => (p ? { ...p, neighbourhood: e.target.value || null } : p))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="property_size">Property size</Label>
                  <Select
                    value={project.property_size ?? "__empty__"}
                    onValueChange={(v) => setProject((p) => (p ? { ...p, property_size: v === "__empty__" ? null : v } : p))}
                  >
                    <SelectTrigger id="property_size">
                      <SelectValue placeholder="-" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__empty__">-</SelectItem>
                      <SelectItem value="basement">Basement</SelectItem>
                      <SelectItem value="half_house">Half house</SelectItem>
                      <SelectItem value="full_house">Full house</SelectItem>
                      <SelectItem value="full_estate">Full estate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job_date">Job date</Label>
                  <Input
                    type="date"
                    id="job_date"
                    value={project.job_date ?? ""}
                    onChange={(e) => setProject((p) => (p ? { ...p, job_date: e.target.value || null } : p))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start_time">Start time</Label>
                  <Input
                    type="time"
                    id="start_time"
                    value={formatTime(project.start_time)}
                    onChange={(e) => setProject((p) => (p ? { ...p, start_time: e.target.value || null } : p))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quote_amount">Quote amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    id="quote_amount"
                    value={project.quote_amount ?? ""}
                    onChange={(e) => setProject((p) => (p ? { ...p, quote_amount: e.target.value ? parseFloat(e.target.value) : null } : p))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoice_amount">Invoice amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    id="invoice_amount"
                    value={project.invoice_amount ?? ""}
                    onChange={(e) => setProject((p) => (p ? { ...p, invoice_amount: e.target.value ? parseFloat(e.target.value) : null } : p))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={project.notes ?? ""}
                  onChange={(e) => setProject((p) => (p ? { ...p, notes: e.target.value || null } : p))}
                  rows={3}
                />
              </div>
              <Button onClick={handleSaveDetails} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Key and access</CardTitle>
              <CardDescription>Access type, lockbox, instructions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="access_type">Access type</Label>
                  <Select
                    value={(access.access_type as string) ?? "__empty__"}
                    onValueChange={(v) => setAccess((a) => ({ ...a, access_type: v === "__empty__" ? null : v }))}
                  >
                    <SelectTrigger id="access_type">
                      <SelectValue placeholder="-" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__empty__">-</SelectItem>
                      {ACCESS_TYPES.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="received_from">Received from</Label>
                  <Input
                    id="received_from"
                    value={(access.received_from as string) ?? ""}
                    onChange={(e) => setAccess((a) => ({ ...a, received_from: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="received_date">Received date</Label>
                  <Input
                    type="datetime-local"
                    id="received_date"
                    value={((access.received_date as string) ?? "").replace(" ", "T").slice(0, 16)}
                    onChange={(e) => setAccess((a) => ({ ...a, received_date: e.target.value ? new Date(e.target.value).toISOString() : null }))}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="lockbox_code">Lockbox code</Label>
                  <Input
                    type="password"
                    id="lockbox_code"
                    value={(access.lockbox_code as string) ?? ""}
                    onChange={(e) => setAccess((a) => ({ ...a, lockbox_code: e.target.value }))}
                    placeholder="Masked"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="building_instructions">Building instructions</Label>
                  <Textarea
                    id="building_instructions"
                    value={(access.building_instructions as string) ?? ""}
                    onChange={(e) => setAccess((a) => ({ ...a, building_instructions: e.target.value }))}
                    rows={2}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="parking_instructions">Parking instructions</Label>
                  <Input
                    id="parking_instructions"
                    value={(access.parking_instructions as string) ?? ""}
                    onChange={(e) => setAccess((a) => ({ ...a, parking_instructions: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="key_returned_to">Key returned to</Label>
                  <Input
                    id="key_returned_to"
                    value={(access.key_returned_to as string) ?? ""}
                    onChange={(e) => setAccess((a) => ({ ...a, key_returned_to: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="key_returned_date">Key returned date</Label>
                  <Input
                    type="datetime-local"
                    id="key_returned_date"
                    value={((access.key_returned_date as string) ?? "").replace(" ", "T").slice(0, 16)}
                    onChange={(e) => setAccess((a) => ({ ...a, key_returned_date: e.target.value ? new Date(e.target.value).toISOString() : null }))}
                  />
                </div>
              </div>
              <Button onClick={handleSaveAccess} disabled={saving}>
                {saving ? "Saving..." : "Save access"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crew" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Crew assignment</CardTitle>
              <CardDescription>Assign crew members to this job. Save to apply.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {crewData ? (
                <>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Assigned ({selectedCrewIds.size})</p>
                    {crewData.all.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No crew members yet. Invite crew from Team.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {crewData.all.map((member) => {
                          const assigned = selectedCrewIds.has(member.id);
                          return (
                            <li
                              key={member.id}
                              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                            >
                              <span className="font-medium">{member.name}</span>
                              <span className="text-muted-foreground truncate ml-2">{member.email}</span>
                              <Button
                                type="button"
                                variant={assigned ? "secondary" : "outline"}
                                size="sm"
                                className="shrink-0 ml-2"
                                onClick={() => handleCrewToggle(member.id, assigned)}
                              >
                                {assigned ? "Remove" : "Add"}
                              </Button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                  <Button onClick={handleSaveCrew} disabled={crewSaving || crewData.all.length === 0}>
                    {crewSaving ? "Saving..." : "Save crew"}
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Loading crew…</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklist">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Service-specific checklist (Task 16).</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Project notes are in the Details tab.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
