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
import { Skeleton } from "@/components/ui/skeleton";

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
            <div className="space-y-3">
              <div className="flex gap-4 border-b pb-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-16 ml-auto" />
              </div>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex gap-4 py-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-14 ml-auto rounded-md" />
                </div>
              ))}
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
                  <TableHead>Neighbourhood</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link href={`/clients/${c.id}`} className="font-medium text-primary hover:underline">
                        {c.first_name} {c.last_name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.email ?? "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{c.phone ?? "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{c.neighbourhood ?? "-"}</TableCell>
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
