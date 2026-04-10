"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Mail, Copy, Check, SearchX, ChevronDown, MoreHorizontal, UserPlus } from "lucide-react";
import { AddContactDialog } from "@/components/contacts/add-contact-dialog";
import { ImportContactsDialog } from "@/components/contacts/import-contacts-dialog";
import { DeleteContactDialog, type DeleteContactTarget } from "@/components/contacts/delete-contact-dialog";

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
  client_id: string | null;
  created_at: string;
};

const STATUS_BADGE: Record<string, "secondary" | "default" | "outline" | "destructive"> = {
  new: "secondary",
  contacted: "default",
  responded: "default",
  client: "outline",
  archived: "destructive",
  reopened: "default",
};

const STATUS_LABEL: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  responded: "Responded",
  client: "Client",
  archived: "Archived",
  reopened: "Reopened",
};

const VIEW_LABELS: Record<View, string> = {
  all: "All contacts",
  follow_up: "Follow up today",
  no_response: "No response",
  responded: "Responded (pipeline)",
};

const STATUS_FILTER_OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "responded", label: "Responded" },
  { value: "client", label: "Client" },
  { value: "archived", label: "Archived" },
  { value: "reopened", label: "Reopened" },
] as const;

const FOUND_VIA_LABEL: Record<string, string> = {
  apollo: "Apollo",
  linkedin: "LinkedIn",
  realtor_ca: "Realtor.ca",
  lsoo: "LSOO",
  quo: "Quo",
  referral: "Referral",
  other: "Other",
};

function ContactActionsMenu({
  contact,
  copyEmail,
  onRequestDelete,
}: {
  contact: Contact;
  copyEmail: (email: string, id: string) => void;
  onRequestDelete: (c: Contact) => void;
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
            <DropdownMenuItem className="cursor-pointer" onSelect={() => copyEmail(contact.email!, contact.id)}>
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
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onSelect={() => onRequestDelete(contact)}
        >
          Delete contact
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ContactMobileRow({
  contact,
  copiedId,
  copyEmail,
  formatDate,
  onRequestDelete,
}: {
  contact: Contact;
  copiedId: string | null;
  copyEmail: (email: string, id: string) => void;
  formatDate: (d: string | null) => string;
  onRequestDelete: (c: Contact) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const subtitle = [contact.type?.replace(/_/g, " "), contact.company].filter(Boolean).join(" · ");

  return (
    <div className="rounded-lg border border-border/80 bg-card text-card-foreground shadow-sm">
      <div className="p-3">
        <div className="flex gap-2">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={STATUS_BADGE[contact.status] ?? "secondary"} className="shrink-0">
                {STATUS_LABEL[contact.status] ?? contact.status}
              </Badge>
              <Link href={`/contacts/${contact.id}`} className="min-w-0 font-medium text-primary hover:underline">
                <span className="block truncate">
                  {contact.first_name} {contact.last_name}
                </span>
              </Link>
            </div>
            {subtitle ? <p className="truncate text-xs text-muted-foreground">{subtitle}</p> : null}
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
                    {copiedId === contact.id ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
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
          <ContactActionsMenu contact={contact} copyEmail={copyEmail} onRequestDelete={onRequestDelete} />
        </div>
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse details" : "Expand details"}
            onClick={() => setExpanded((v) => !v)}
            className="shrink-0 rounded-md p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronDown className={cn("size-5 transition-transform duration-200", expanded && "rotate-180")} />
          </button>
        </div>
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
                {contact.found_via
                  ? (FOUND_VIA_LABEL[contact.found_via] ?? contact.found_via.replace(/_/g, " "))
                  : "—"}
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
                {contact.converted_to_client ? " · Client" : ""}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}
    </div>
  );
}

function ContactsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [view, setView] = useState<View>("all");
  const [statusFilter, setStatusFilter] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const pageSizeOptions = [10, 20, 50, 100];
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [listVersion, setListVersion] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<DeleteContactTarget | null>(null);

  useEffect(() => {
    if (searchParams.get("add") !== "1") return;
    setAddContactOpen(true);
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

  useEffect(() => {
    setLoading(true);
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

  const handleListChange = (v: string) => {
    const next = v as View;
    if (next === "all" || next === "follow_up" || next === "no_response" || next === "responded") {
      setView(next);
      setStatusFilter("");
      setPage(1);
    }
  };

  const handleStatusFilterChange = (v: string) => {
    if (v === "__any__") setStatusFilter("");
    else setStatusFilter(v);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setView("all");
    setStatusFilter("");
    setPage(1);
  };

  const openDelete = (c: Contact) => {
    setDeleteTarget({
      id: c.id,
      first_name: c.first_name,
      last_name: c.last_name,
      client_id: c.client_id,
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">Contacts</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Track outreach and convert to clients</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button type="button" onClick={() => setAddContactOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add contact
          </Button>
          <Button type="button" variant="outline" onClick={() => setImportOpen(true)}>
            Import CSV
          </Button>
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

      <ImportContactsDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onSuccess={() => {
          setListVersion((v) => v + 1);
          setPage(1);
        }}
      />

      <DeleteContactDialog
        contact={deleteTarget}
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onDeleted={() => {
          setListVersion((v) => v + 1);
          setDeleteTarget(null);
        }}
        onArchived={() => {
          setListVersion((v) => v + 1);
          setDeleteTarget(null);
        }}
      />

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Select value={view} onValueChange={handleListChange}>
              <SelectTrigger className="h-9 w-full sm:w-[min(100%,14rem)]" aria-label="List filter">
                <SelectValue placeholder="List" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>List</SelectLabel>
                  {(Object.keys(VIEW_LABELS) as View[]).map((v) => (
                    <SelectItem key={v} value={v}>
                      {VIEW_LABELS[v]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select value={statusFilter || "__any__"} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="h-9 w-full sm:w-[min(100%,14rem)]" aria-label="Status filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Status</SelectLabel>
                  <SelectItem value="__any__">Any status</SelectItem>
                  {STATUS_FILTER_OPTIONS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Input
              type="search"
              placeholder="Search name, company, email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-9 min-w-0 w-full sm:w-64"
            />
          </div>

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
                <Button type="button" variant="outline" onClick={clearFilters}>
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
                    onRequestDelete={openDelete}
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
                          <Badge variant={STATUS_BADGE[c.status] ?? "secondary"}>
                            {STATUS_LABEL[c.status] ?? c.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <Link href={`/contacts/${c.id}`} className="font-medium text-primary hover:underline">
                              {c.first_name} {c.last_name}
                            </Link>
                            {c.type || c.company ? (
                              <span className="text-xs text-muted-foreground">
                                {[c.type?.replace(/_/g, " "), c.company].filter(Boolean).join(" · ")}
                              </span>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
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
                                  {copiedId === c.id ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
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
                          <ContactActionsMenu contact={c} copyEmail={copyEmail} onRequestDelete={openDelete} />
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

export default function ContactsPage() {
  return (
    <Suspense
      fallback={<LoadingSpinner className="min-h-[200px]" message="Loading…" />}
    >
      <ContactsPageContent />
    </Suspense>
  );
}
