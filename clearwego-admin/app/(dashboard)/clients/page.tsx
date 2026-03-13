"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
import { Mail, Copy, Check } from "lucide-react";

type Client = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  neighbourhood: string | null;
  referral_source: string | null;
  created_at: string;
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyEmail = (email: string, id: string) => {
    if (!email) return;
    void navigator.clipboard.writeText(email).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  useEffect(() => {
    fetch("/api/clients")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setClients(data.clients ?? []);
      })
      .catch(() => setClients([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Clients</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Client profiles and timelines</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All clients</CardTitle>
          <CardDescription>Convert contacts to create clients</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex min-h-[200px] items-center justify-center py-8">
              <p className="text-muted-foreground">Loading…</p>
            </div>
          ) : clients.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No clients yet. Convert a contact to create one.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
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
                        {(c.referral_source || c.neighbourhood) ? (
                          <span className="text-xs text-muted-foreground">
                            {[c.referral_source, c.neighbourhood].filter(Boolean).join(" · ")}
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
                    <TableCell className="text-muted-foreground">{c.phone ?? "-"}</TableCell>
                    <TableCell>
                      <Link href={`/clients/${c.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
