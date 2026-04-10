"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export type DeleteContactTarget = {
  id: string;
  first_name: string;
  last_name: string;
  client_id: string | null;
};

export function DeleteContactDialog({
  contact,
  open,
  onOpenChange,
  onDeleted,
  onArchived,
}: {
  contact: DeleteContactTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
  onArchived?: () => void;
}) {
  const [projectCount, setProjectCount] = useState<number | null>(null);
  const [loadingImpact, setLoadingImpact] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !contact) {
      setProjectCount(null);
      setError(null);
      setDeleting(false);
      setArchiving(false);
      return;
    }
    if (!contact.client_id) {
      setProjectCount(0);
      return;
    }
    setLoadingImpact(true);
    setProjectCount(null);
    fetch(`/api/contacts/${contact.id}/delete-impact`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setProjectCount(typeof data.projectCount === "number" ? data.projectCount : 0);
      })
      .catch(() => setProjectCount(0))
      .finally(() => setLoadingImpact(false));
  }, [open, contact]);

  const handleDelete = () => {
    if (!contact) return;
    setDeleting(true);
    setError(null);
    fetch(`/api/contacts/${contact.id}`, { method: "DELETE" })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Delete failed");
        onOpenChange(false);
        onDeleted();
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setDeleting(false));
  };

  const handleArchive = () => {
    if (!contact) return;
    setArchiving(true);
    setError(null);
    fetch(`/api/contacts/${contact.id}/archive`, { method: "POST" })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Archive failed");
        onOpenChange(false);
        onArchived?.();
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setArchiving(false));
  };

  const name = contact ? `${contact.first_name} ${contact.last_name}`.trim() : "";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete contact permanently?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                This will <span className="font-medium text-foreground">permanently delete</span>{" "}
                <span className="font-medium text-foreground">{name || "this contact"}</span> and cannot be undone.
              </p>
              {contact?.client_id ? (
                <p>
                  They are linked to a client. Deleting will also permanently remove that client and every project linked
                  to them
                  {!loadingImpact && projectCount !== null && projectCount > 0
                    ? ` (${projectCount} project${projectCount === 1 ? "" : "s"})`
                    : ""}
                  .
                </p>
              ) : null}
              <p className="text-foreground/90">
                Prefer to keep a record? Use <strong className="font-medium">Mark as archived</strong> to set status to
                Archived and unlink from a client. They stay on the contacts list and you can filter by Archived.
              </p>
              {error ? <p className="text-destructive">{error}</p> : null}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={handleArchive}
              loading={archiving}
              disabled={deleting || archiving}
            >
              {archiving ? "Saving…" : "Mark as archived instead"}
            </Button>
          </div>
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel type="button" disabled={deleting || archiving}>
              Cancel
            </AlertDialogCancel>
            <Button type="button" variant="destructive" onClick={handleDelete} loading={deleting} disabled={deleting || archiving}>
              {deleting ? "Deleting…" : "Delete permanently"}
            </Button>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
