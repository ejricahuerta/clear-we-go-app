"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Mail, Check, Users, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CLIENT_STATUS_LABELS, isClientStatus } from "@/lib/clients/status";
import { AddClientDrawer } from "@/components/clients/add-client-drawer";

type Client = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  neighbourhood: string | null;
  referral_source: string | null;
  status?: string | null;
  created_at: string;
};

function ClientsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("add") !== "1") return;
    setAddOpen(true);
    const next = new URLSearchParams(searchParams.toString());
    next.delete("add");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [searchParams, pathname, router]);
  const copyEmail = (email: string, id: string) => {
    if (!email) return;
    void navigator.clipboard.writeText(email).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const refresh = () => {
    setLoading(true);
    fetch("/api/clients")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setClients(data.clients ?? []);
      })
      .catch(() => setClients([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 pr-2">
          <h1 className="text-2xl font-semibold">Clients</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Client profiles and timelines</p>
        </div>
        <Button
          type="button"
          onClick={() => setAddOpen(true)}
          size="icon"
          className="shrink-0 touch-manipulation gap-2 sm:h-9 sm:w-auto sm:px-4"
          aria-label="Add client"
        >
          <UserPlus className="size-4" aria-hidden />
          <span className="hidden sm:inline">Add client</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All clients</CardTitle>
          <CardDescription>Add clients or convert them from contacts</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSpinner className="min-h-[200px]" />
          ) : clients.length === 0 ? (
            <Empty className="py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Users className="size-6" />
                </EmptyMedia>
                <EmptyTitle>No clients yet</EmptyTitle>
                <EmptyDescription>Add a client or convert a contact.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent className="flex flex-wrap gap-2 justify-center">
                <Button onClick={() => setAddOpen(true)}>Add client</Button>
                <Link href="/contacts">
                  <Button variant="outline">View contacts</Button>
                </Link>
              </EmptyContent>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="w-[200px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <Link href={`/clients/${c.id}`} className="font-medium text-primary hover:underline">
                          {c.first_name} {c.last_name}
                        </Link>
                        {c.referral_source || c.neighbourhood ? (
                          <span className="text-xs text-muted-foreground">
                            {[c.referral_source, c.neighbourhood].filter(Boolean).join(" · ")}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal">
                        {c.status && isClientStatus(c.status) ? CLIENT_STATUS_LABELS[c.status] : c.status ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {c.email ? (
                        <div className="flex min-w-0 items-center gap-1.5">
                          <a
                            href={`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(c.email)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open in Gmail"
                            className="inline-flex shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <Mail className="h-4 w-4" />
                          </a>
                          <button
                            type="button"
                            onClick={() => copyEmail(c.email!, c.id)}
                            title="Copy email"
                            className="min-w-0 cursor-pointer truncate text-left hover:text-foreground hover:underline focus:outline-none focus:underline inline-flex items-center gap-1"
                          >
                            <span className="truncate">{c.email}</span>
                            {copiedId === c.id ? (
                              <Check className="h-3.5 w-3.5 shrink-0 text-green-600" aria-hidden />
                            ) : null}
                          </button>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.phone ?? "-"}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/clients/${c.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddClientDrawer open={addOpen} onOpenChange={setAddOpen} onSuccess={refresh} />
    </div>
  );
}

export default function ClientsPage() {
  return (
    <Suspense
      fallback={<LoadingSpinner className="min-h-[200px]" message="Loading…" />}
    >
      <ClientsPageContent />
    </Suspense>
  );
}
