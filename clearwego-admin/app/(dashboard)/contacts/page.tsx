"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { Skeleton } from "@/components/ui/skeleton";

type View = "all" | "follow_up" | "no_response" | "responded";

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
  email_2_sent: boolean;
  email_3_sent: boolean;
  last_contacted_date: string | null;
  follow_up_date: string | null;
  converted_to_client: boolean;
  created_at: string;
};

type Stats = {
  thisMonth: { added: number; contacted: number; responded: number; converted: number; rate: string };
  bySource: { source: string; added: number; responded: number; converted: number; rate: string }[];
};

const STATUS_BADGE: Record<string, "secondary" | "default" | "outline" | "destructive"> = {
  new: "secondary",
  contacted: "default",
  responded: "default",
  converted: "outline",
  dead: "destructive",
};

const STATUS_LABEL: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  responded: "Responded",
  converted: "Converted",
  dead: "Closed",
};

const VIEW_LABELS: Record<View, string> = {
  all: "All Contacts",
  follow_up: "Follow Up Today",
  no_response: "No Response",
  responded: "Responded",
};

export default function ContactsPage() {
  const [view, setView] = useState<View>("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const pageSizeOptions = [10, 20, 50, 100];

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("view", view);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);

    fetch(`/api/contacts?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setContacts(data.contacts ?? []);
        setTotal(data.total ?? 0);
      })
      .catch(() => setContacts([]))
      .finally(() => setLoading(false));
  }, [view, search, statusFilter, page, pageSize]);

  useEffect(() => {
    fetch("/api/contacts/stats")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(() => {});
  }, []);

  const formatDate = (d: string | null) => (d ? new Date(d).toLocaleDateString() : "-");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Contacts</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Track outreach and convert to clients</p>
        </div>
        <Link href="/contacts/import">
          <Button variant="outline">Import CSV</Button>
        </Link>
      </div>

      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">This month</CardTitle>
            <CardDescription>
              Added: {stats.thisMonth.added} · Contacted: {stats.thisMonth.contacted} · Responded: {stats.thisMonth.responded} · Converted: {stats.thisMonth.converted} · Rate: {stats.thisMonth.rate}
            </CardDescription>
          </CardHeader>
          {stats.bySource.length > 0 && (
            <CardContent className="pt-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead>Responded</TableHead>
                      <TableHead>Converted</TableHead>
                      <TableHead>Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.bySource.map((s) => (
                      <TableRow key={s.source}>
                        <TableCell className="capitalize">{s.source.replace(/_/g, " ")}</TableCell>
                        <TableCell>{s.added}</TableCell>
                        <TableCell>{s.responded}</TableCell>
                        <TableCell>{s.converted}</TableCell>
                        <TableCell>{s.rate}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      <Card>
        <CardContent className="p-6 space-y-4">
          <Tabs value={view} onValueChange={(v) => setView(v as View)}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <TabsList className="grid grid-cols-4 max-w-lg shrink-0">
                {(Object.keys(VIEW_LABELS) as View[]).map((v) => (
                  <TabsTrigger key={v} value={v}>{VIEW_LABELS[v]}</TabsTrigger>
                ))}
              </TabsList>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={statusFilter || "__all__"} onValueChange={(v) => setStatusFilter(v === "__all__" ? "" : v)}>
                  <SelectTrigger className="h-9 w-[10rem]">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All statuses</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="responded">Responded</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="dead">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="search"
                  placeholder="Search name, company, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-64"
                />
              </div>
            </div>
          </Tabs>

          {loading ? (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Skeleton className="h-9 w-32" />
                <Skeleton className="h-9 w-40" />
              </div>
              <div className="space-y-3">
                <div className="flex gap-4 border-b pb-3">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-14" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-14 ml-auto" />
                </div>
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div key={i} className="flex gap-4 py-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-14 ml-auto rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          ) : contacts.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No contacts match.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last contacted</TableHead>
                    <TableHead>Follow up</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <Link href={`/contacts/${c.id}`} className="font-medium text-primary hover:underline">
                          {c.first_name} {c.last_name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{c.company ?? "-"}</TableCell>
                      <TableCell className="text-muted-foreground">{c.type ? c.type.replace(/_/g, " ") : "-"}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_BADGE[c.status] ?? "secondary"}>{STATUS_LABEL[c.status] ?? c.status}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(c.last_contacted_date)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(c.follow_up_date)}</TableCell>
                      <TableCell>
                        <Link href={`/contacts/${c.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {total > 0 && (
                <TablePagination
                  page={page}
                  pageSize={pageSize}
                  total={total}
                  onPageChange={setPage}
                  pageSizeOptions={pageSizeOptions}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPage(1);
                  }}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
