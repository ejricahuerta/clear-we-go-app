"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type PreviewRow = {
  first_name: string;
  last_name: string;
  company: string;
  type: string;
  email: string;
  phone: string;
  neighbourhood: string;
  found_via: string;
  duplicate?: "email" | "phone" | "both";
};

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

const FIELD_ALIASES: Record<string, string[]> = {
  first_name: ["first_name", "firstname", "first_name", "first", "given_name", "givenname", "fname"],
  last_name: ["last_name", "lastname", "last_name", "last", "surname", "family_name", "familyname", "lname"],
  company: ["company", "company_name", "companyname", "organization", "org", "company_name_for_emails"],
  type: ["title", "job_title", "jobtitle", "role", "type", "position"],
  email: ["email", "email_address", "emailaddress", "e_mail", "primary_email", "secondary_email", "tertiary_email"],
  phone: ["phone", "phone_number", "phonenumber", "telephone", "mobile", "mobile_phone", "work_direct_phone", "corporate_phone", "other_phone", "home_phone", "work_phone"],
  neighbourhood: ["city", "neighbourhood", "neighborhood", "location", "company_city", "town", "region"],
  found_via: ["found_via", "source", "lead_source", "origin"],
};

const SMART_HEADER_MAP: Record<string, string> = {};
Object.entries(FIELD_ALIASES).forEach(([field, aliases]) => {
  aliases.forEach((alias) => {
    SMART_HEADER_MAP[alias] = field;
  });
});

function mapRow(headers: string[], values: string[]): Record<string, string> {
  const row: Record<string, string> = {};
  headers.forEach((h, i) => {
    const normalized = normalizeHeader(h);
    const field = SMART_HEADER_MAP[normalized];
    const value = values[i]?.trim() ?? "";
    if (field) {
      if (row[field] === undefined) row[field] = value || "";
      else if (value.trim() && !(row[field]?.trim())) row[field] = value;
    } else {
      const fallbackKey = normalized || `col_${i}`;
      row[fallbackKey] = value;
    }
  });
  return row;
}

function mapTitleToType(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("realtor") || (t.includes("real estate") && t.includes("agent"))) return "realtor";
  if (t.includes("lawyer")) return "estate_lawyer";
  if (t.includes("property") || t.includes("manager")) return "property_manager";
  return "other";
}

export function ImportContactsDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [, setDuplicateCount] = useState(0);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setPreview([]);
      setDuplicateCount(0);
      setDone(false);
      setError(null);
      setConfirmOpen(false);
      setErrorDialogOpen(false);
    }
  }, [open]);

  const parseCsv = useCallback((text: string): PreviewRow[] => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    const rows: PreviewRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].match(/(?:[^,"]+|"[^"]*")+/g)?.map((v) => v.trim().replace(/^"|"$/g, "")) ?? [];
      const raw = mapRow(headers, values);
      const type = raw.type ? mapTitleToType(raw.type) : "other";
      const found_via = (raw.found_via || "apollo").toLowerCase().replace(/\s+/g, "_");
      const validFoundVia = ["apollo", "linkedin", "realtor_ca", "lsoo", "quo", "referral", "other"].includes(found_via)
        ? found_via
        : "other";
      rows.push({
        first_name: raw.first_name || "Unknown",
        last_name: raw.last_name || "",
        company: raw.company || "",
        type: ["estate_lawyer", "realtor", "property_manager", "other"].includes(raw.type) ? raw.type : type,
        email: raw.email || "",
        phone: raw.phone || "",
        neighbourhood: raw.neighbourhood || raw.city || "",
        found_via: validFoundVia,
      });
    }
    return rows;
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFile(f ?? null);
    setPreview([]);
    setDuplicateCount(0);
    setDone(false);
    setError(null);
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result);
      const rows = parseCsv(text);
      setPreview(rows);
      fetch("/api/contacts/import-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) throw new Error(data.error);
          setPreview(data.rows ?? rows);
          setDuplicateCount(data.duplicateCount ?? 0);
        })
        .catch(() => setDuplicateCount(0));
    };
    reader.readAsText(f);
  };

  const startImport = () => {
    if (preview.filter((r) => !r.duplicate).length === 0) return;
    setConfirmOpen(true);
  };

  const handleImport = () => {
    setConfirmOpen(false);
    if (preview.length === 0) return;
    setImporting(true);
    setError(null);
    const toImport = preview.filter((r) => !r.duplicate);
    fetch("/api/contacts/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: toImport }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setDone(true);
        onSuccess();
      })
      .catch((e: Error) => {
        setError(e.message);
        setErrorDialogOpen(true);
      })
      .finally(() => setImporting(false));
  };

  const handleCloseDone = () => {
    onOpenChange(false);
  };

  const newCount = preview.filter((r) => !r.duplicate).length;
  const dupCount = preview.filter((r) => r.duplicate).length;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import contacts</DialogTitle>
            <DialogDescription>
              Upload a CSV. Columns are auto-mapped by name (e.g. First Name, Company, Email, Phone, City, Title).
            </DialogDescription>
          </DialogHeader>

          {done ? (
            <Card className="border-green-200 dark:border-green-900/50 bg-green-50/50 dark:bg-green-950/20">
              <CardHeader>
                <CardTitle className="text-base">Import complete</CardTitle>
                <CardDescription>Contacts have been imported successfully.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button type="button" onClick={handleCloseDone}>
                  Done
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Upload CSV</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="import-csv-file-modal">Choose file</Label>
                    <input
                      id="import-csv-file-modal"
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground file:hover:bg-primary/90"
                    />
                  </div>
                </CardContent>
              </Card>

              {error && !errorDialogOpen ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}

              {preview.length > 0 && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle className="text-base">Preview</CardTitle>
                      <CardDescription>
                        {newCount} new, {dupCount} duplicates (skipped)
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      onClick={startImport}
                      loading={importing}
                      disabled={importing || newCount === 0}
                    >
                      {importing ? "Importing…" : `Import ${newCount} contacts`}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-80 overflow-y-auto overflow-x-auto rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="w-[100px]">Duplicate</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {preview.slice(0, 50).map((r, i) => (
                            <TableRow key={i}>
                              <TableCell>
                                {r.first_name} {r.last_name}
                              </TableCell>
                              <TableCell>{r.company}</TableCell>
                              <TableCell>{r.email}</TableCell>
                              <TableCell>
                                {r.duplicate ? (
                                  <Badge variant="secondary">{r.duplicate}</Badge>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {preview.length > 50 && (
                      <p className="mt-2 text-sm text-muted-foreground">Showing first 50 of {preview.length}</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm import</DialogTitle>
            <DialogDescription>
              Import {newCount} new contacts? Duplicates ({dupCount}) will be skipped.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="button" onClick={handleImport} loading={importing}>
              {importing ? "Importing…" : "Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import failed</DialogTitle>
            <DialogDescription>{error ?? "Something went wrong."}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
