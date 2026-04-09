"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ContactStats = {
  thisMonth: {
    added: number;
    contacted: number;
    responded: number;
    converted: number;
    rate: string;
  };
  bySource: { source: string; added: number; responded: number; converted: number; rate: string }[];
};

export function ContactKpisCard() {
  const [stats, setStats] = useState<ContactStats | null>(null);

  useEffect(() => {
    fetch("/api/contacts/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) return;
        setStats(data);
      })
      .catch(() => {});
  }, []);

  if (!stats) return null;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
        <div>
          <CardTitle className="text-base">Contacts — this month</CardTitle>
          <CardDescription>
            Added: {stats.thisMonth.added} · Contacted: {stats.thisMonth.contacted} · Responded:{" "}
            {stats.thisMonth.responded} · Converted: {stats.thisMonth.converted} · Rate:{" "}
            {stats.thisMonth.rate}
          </CardDescription>
        </div>
        <Link href="/contacts" className="text-sm text-primary hover:underline shrink-0">
          View contacts
        </Link>
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
  );
}
