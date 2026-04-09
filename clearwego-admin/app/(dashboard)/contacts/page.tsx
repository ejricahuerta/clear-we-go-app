"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Mail, Copy, Check, SearchX, ChevronDown, MoreHorizontal, UserPlus } from "lucide-react";
import { AddContactDialog } from "@/components/contacts/add-contact-dialog";

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

function ContactActionsMenu({
  contact,
  copyEmail,
}: {
  contact: Contact;
  copyEmail: (email: string, id: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="More actions">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href={`/contacts/${contact.id}`} className="cursor-pointer">
            View details
          </Link>
        </DropdownMenuItem>
        {contact.email ? (
          <>
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={() => copyEmail(contact.email!, contact.id)}
            >
              Copy email
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a
                href={`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(contact.email)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer"
              >
                Open in Gmail
              </a>
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ContactMobileRow({
  contact,
  copiedId,
  copyEmail,
  formatDate,
}: {
  contact: Contact;
  copiedId: string | null;
  copyEmail: (email: string, id: string) => void;
  formatDate: (d: string | null) => string;
}) {
  const [expanded, setExpanded] = useState(false);
  const subtitle = [contact.type?.replace(/_/g, " "), contact.company].filter(Boolean).join(" · ");

  return (
    <div className="rounded-lg border border-border/80 bg-card text-card-foreground shadow-sm">
      <div className="flex gap-2 p-3">
        <button
          type="button"
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse details" : "Expand details"}
          onClick={() => setExpanded((v) => !v)}
          className="mt-0.5 shrink-0 rounded-md p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronDown className={cn("size-5 transition-transform duration-200", expanded && "rotate-180")} />
        </button>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={STATUS_BADGE[contact.status] ?? "secondary"} className="shrink-0">
              {STATUS_LABEL[contact.status] ?? contact.status}
            </Badge>
            <Link
              href={`/contacts/${contact.id}`}
              className="min-w-0 font-medium text-primary hover:underline"
            >
              <span className="block truncate">
                {contact.first_name} {contact.last_name}
              </span>
            </Link>
          </div>
          {subtitle ? (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
          {contact.email ? (
            <div className="flex min-w-0 items-center gap-1">
              <button
                type="button"
                onClick={() => copyEmail(contact.email!, contact.id)}
                title="Copy email"
                className="min-w-0 flex-1 cursor-pointer truncate text-left text-sm text-muted-foreground hover:text-foreground hover:underline focus:outline-none focus:underline"
              >
                {contact.email}
              </button>
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => copyEmail(contact.email!, contact.id)}
                  title="Copy email"
                  className="inline-flex rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none"
                >
                  {copiedId === contact.id ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
                <a
                  href={`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(contact.email)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open in Gmail"
                  className="inline-flex rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Mail className="h-4 w-4" />
                </a>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No email</p>
          )}
        </div>
        <ContactActionsMenu contact={contact} copyEmail={copyEmail} />
      </div>
      {expanded ? (
        <div className="space-y-3 border-t border-border/80 bg-muted/30 px-3 py-3 text-sm">
          <dl className="grid gap-2">
            <div className="grid grid-cols-[6.5rem_1fr] gap-2">
              <dt className="text-muted-foreground">Phone</dt>
              <dd className="min-w-0 break-words">{contact.phone ?? "—"}</dd>
            </div>
            <div className="grid grid-cols-[6.5rem_1fr] gap-2">
              <dt className="text-muted-foreground">Neighbourhood</dt>
              <dd className="min-w-0 break-words">{contact.neighbourhood ?? "—"}</dd>
            </div>
            <div className="grid grid-cols-[6.5rem_1fr] gap-2">
              <dt className="text-muted-foreground">Found via</dt>
              <dd className="min-w-0 break-words">
                {contact.found_via ? contact.found_via.replace(/_/g, " ") : "—"}
              </dd>
            </div>
            <div className="grid grid-cols-[6.5rem_1fr] gap-2">
              <dt className="text-muted-foreground">Last contacted</dt>
              <dd>{formatDate(contact.last_contacted_date)}</dd>
            </div>
            <div className="grid grid-cols-[6.5rem_1fr] gap-2">
              <dt className="text-muted-foreground">Follow up</dt>
              <dd>{formatDate(contact.follow_up_date)}</dd>
            </div>
            <div className="grid grid-cols-[6.5rem_1fr] gap-2">
              <dt className="text-muted-foreground">Outreach</dt>
              <dd className="text-xs text-muted-foreground">
                1: {contact.email_1_sent ? "Sent" : "—"} · 2: {contact.email_2_sent ? "Sent" : "—"} · 3:{" "}
                {contact.email_3_sent ? "Sent" : "—"}
                {contact.converted_to_client ? " · Converted" : ""}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}
    </div>
  );
}

export default function ContactsPage() {
  const [view, setView] = useState<View>("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const pageSizeOptions = [10, 20, 50, 100];
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [listVersion, setListVersion] = useState(0);

  const copyEmail = (email: string, id: string) => {
    if (!email) return;
    void navigator.clipboard.writeText(email).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

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
  }, [view, search, statusFilter, page, pageSize, listVersion]);

  const formatDate = (d: string | null) => (d ? new Date(d).toLocaleDateString() : "-");

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">Contacts</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Track outreach and convert to clients</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button type="button" onClick={() => setAddContactOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add contact
          </Button>
          <Link href="/contacts/import">
            <Button variant="outline">Import CSV</Button>
          </Link>
        </div>
      </div>

      <AddContactDialog
        open={addContactOpen}
        onOpenChange={setAddContactOpen}
        onSuccess={() => {
          setListVersion((v) => v + 1);
          setPage(1);
        }}
      />

      <Card>
        <CardContent className="p-6 space-y-4">
          <Tabs value={view} onValueChange={(v) => setView(v as View)}>
            <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-between">
              <div className="min-w-0 md:hidden">
                <Select value={view} onValueChange={(v) => setView(v as View)}>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="View" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(VIEW_LABELS) as View[]).map((v) => (
                      <SelectItem key={v} value={v}>
                        {VIEW_LABELS[v]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <TabsList className="hidden w-full max-w-lg shrink-0 grid-cols-4 md:grid">
                {(Object.keys(VIEW_LABELS) as View[]).map((v) => (
                  <TabsTrigger key={v} value={v} className="px-2 sm:px-3">
                    {VIEW_LABELS[v]}
                  </TabsTrigger>
                ))}
              </TabsList>
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <Select value={statusFilter || "__all__"} onValueChange={(v) => setStatusFilter(v === "__all__" ? "" : v)}>
                  <SelectTrigger className="h-9 w-full sm:w-[10rem]">
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
                  className="h-9 min-w-0 w-full sm:w-64"
                />
              </div>
            </div>
          </Tabs>

          {loading ? (
            <LoadingSpinner className="min-h-[200px]" />
          ) : contacts.length === 0 ? (
            <Empty className="py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SearchX className="size-6" />
                </EmptyMedia>
                <EmptyTitle>No contacts match</EmptyTitle>
                <EmptyDescription>Try adjusting your filters or search.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button variant="outline" onClick={() => { setSearch(""); setStatusFilter(""); setPage(1); }}>
                  Clear filters
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <>
              <div className="space-y-2 md:hidden">
                {contacts.map((c) => (
                  <ContactMobileRow
                    key={c.id}
                    contact={c}
                    copiedId={copiedId}
                    copyEmail={copyEmail}
                    formatDate={formatDate}
                  />
                ))}
              </div>
              <div className="hidden md:block md:overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Last contacted</TableHead>
                      <TableHead>Follow up</TableHead>
                      <TableHead className="w-12 text-right">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <Badge variant={STATUS_BADGE[c.status] ?? "secondary"}>{STATUS_LABEL[c.status] ?? c.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <Link href={`/contacts/${c.id}`} className="font-medium text-primary hover:underline">
                              {c.first_name} {c.last_name}
                            </Link>
                            {(c.type || c.company) ? (
                              <span className="text-xs text-muted-foreground">
                                {[c.type?.replace(/_/g, " "), c.company].filter(Boolean).join(" · ")}
                              </span>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          <div className="flex items-center justify-between gap-2">
                            {c.email ? (
                              <button
                                type="button"
                                onClick={() => copyEmail(c.email!, c.id)}
                                title="Copy email"
                                className="min-w-0 flex-1 cursor-pointer truncate text-left hover:text-foreground hover:underline focus:outline-none focus:underline"
                              >
                                {c.email}
                              </button>
                            ) : (
                              <span className="flex-1">-</span>
                            )}
                            {c.email ? (
                              <div className="flex shrink-0 items-center gap-0.5">
                                <button
                                  type="button"
                                  onClick={() => copyEmail(c.email!, c.id)}
                                  title="Copy email"
                                  className="inline-flex rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none"
                                >
                                  {copiedId === c.id ? (
                                    <Check className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </button>
                                <a
                                  href={`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(c.email)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Open in Gmail"
                                  className="inline-flex rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                >
                                  <Mail className="h-4 w-4" />
                                </a>
                              </div>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(c.last_contacted_date)}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(c.follow_up_date)}</TableCell>
                        <TableCell className="text-right">
                          <ContactActionsMenu contact={c} copyEmail={copyEmail} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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
