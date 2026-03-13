"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
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

/** Normalize a CSV header for matching: lowercase, single underscores, no extra chars */
function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

/** Aliases per contact field — any CSV column matching one of these maps to that field */
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
      // First non-empty wins when multiple columns map to same field (e.g. several phone columns)
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
  // Check realtor first — "Real Estate Agent" must not match "estate" -> estate_lawyer
  if (t.includes("realtor") || (t.includes("real estate") && t.includes("agent"))) return "realtor";
  if (t.includes("lawyer")) return "estate_lawyer";
  if (t.includes("property") || t.includes("manager")) return "property_manager";
  return "other";
}

export default function ImportContactsPage() {
  const [, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [, setDuplicateCount] = useState(0);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);

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
      const validFoundVia = ["apollo", "linkedin", "realtor_ca", "lsoo", "referral", "other"].includes(found_via) ? found_via : "other";
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
      })
      .catch((e) => {
        setError(e.message);
        setErrorDialogOpen(true);
      })
      .finally(() => setImporting(false));
  };

  const newCount = preview.filter((r) => !r.duplicate).length;
  const dupCount = preview.filter((r) => r.duplicate).length;

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold">Import</h1>
      {done ? (
        <Card className="border-green-200 dark:border-green-900/50 bg-green-50/50 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle className="text-base">Import complete</CardTitle>
            <CardDescription>Contacts have been imported successfully.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/contacts">
              <Button>Back to contacts</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upload CSV</CardTitle>
              <CardDescription>
                Accepts any CSV: columns are auto-mapped by name (e.g. First Name, Company Name, Email, Phone, City, Title)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="csv-file">Choose file</Label>
                <input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground file:hover:bg-primary/90"
                />
              </div>
            </CardContent>
          </Card>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

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
                  onClick={startImport}
                  loading={importing}
                  disabled={importing || newCount === 0}
                >
                  {importing ? "Importing…" : `Import ${newCount} contacts`}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-hidden max-h-80 overflow-y-auto">
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
                          <TableCell>{r.first_name} {r.last_name}</TableCell>
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
                  <p className="text-sm text-muted-foreground mt-2">
                    Showing first 50 of {preview.length}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm import</DialogTitle>
            <DialogDescription>
              Import {newCount} new contacts? Duplicates ({dupCount}) will be skipped.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleImport} loading={importing}>
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
            <DialogClose asChild><Button>Close</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
