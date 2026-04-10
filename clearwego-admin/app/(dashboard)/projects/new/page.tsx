"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { UserPlus } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

type Client = { id: string; first_name: string; last_name: string };

function NewProjectPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientIdFromUrl = searchParams.get("clientId")?.trim() ?? "";
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState("");
  const [serviceType, setServiceType] = useState("estate_cleanout");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [neighbourhood, setNeighbourhood] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        const list: Client[] = data.clients ?? [];
        setClients(list);
        const fromUrl = clientIdFromUrl;
        if (fromUrl && list.some((c) => c.id === fromUrl)) {
          setClientId(fromUrl);
        } else if (list.length) {
          setClientId(list[0].id);
        }
      })
      .catch(() => setClients([]));
  }, [clientIdFromUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      setError("Please select a client.");
      return;
    }
    setError(null);
    setSubmitting(true);
    fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        service_type: serviceType,
        property_address: propertyAddress.trim(),
        neighbourhood: neighbourhood.trim() || null,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        router.push(`/projects/${data.id}`);
      })
      .catch((e) => setError(e.message))
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="p-6 max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">New project</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">New project</CardTitle>
          <CardDescription>Create a job for a client</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-destructive mb-4">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <div className="flex gap-2 items-center">
                <div className="flex-1 min-w-0">
                  <Select value={clientId || "__empty__"} onValueChange={(v) => setClientId(v === "__empty__" ? "" : v)}>
                    <SelectTrigger id="client" className="w-full">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__empty__">Select client</SelectItem>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  asChild
                  aria-label="Add client via contacts"
                >
                  <Link href="/contacts" title="Add client via contacts">
                    <UserPlus className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="service_type">Service type</Label>
              <Select value={serviceType} onValueChange={setServiceType}>
                <SelectTrigger id="service_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="estate_cleanout">Estate cleanout</SelectItem>
                  <SelectItem value="presale_clearout">Pre-sale clearout</SelectItem>
                  <SelectItem value="tenant_moveout">Tenant move-out</SelectItem>
                  <SelectItem value="downsizing">Downsizing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="property_address">Property address</Label>
              <Input
                id="property_address"
                value={propertyAddress}
                onChange={(e) => setPropertyAddress(e.target.value)}
                required
                placeholder="123 Main St"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="neighbourhood">Neighbourhood</Label>
              <Input id="neighbourhood" value={neighbourhood} onChange={(e) => setNeighbourhood(e.target.value)} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" loading={submitting}>{submitting ? "Creating…" : "Create project"}</Button>
              <Link href="/projects">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewProjectPage() {
  return (
    <Suspense
      fallback={<LoadingSpinner className="min-h-[200px]" message="Loading…" />}
    >
      <NewProjectPageContent />
    </Suspense>
  );
}
