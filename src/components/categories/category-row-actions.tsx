"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { deleteCategory } from "@/actions/categories.actions";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions";

export function CategoryRowActions({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const router = useRouter();
  const { can } = usePermissions();
  const canMutate = can("mutate");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteCategory(id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Category deleted.");
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href={`/categories/${id}/edit`}>Edit</Link>
      </Button>

      <Button
        variant="destructive"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={!canMutate}
      >
        Delete
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove &quot;{title}&quot;. Products still
              linked to this category cannot be deleted until reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={handleDelete}
            >
              {pending ? "Deleting…" : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
