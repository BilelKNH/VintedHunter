"use client";

import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { useDeleteSearch } from "../../hooks/useSearches";

export interface DeleteSearchDialogProps {
  searchId: string;
  searchName: string;
  open: boolean;
  onOpenChange(open: boolean): void;
}

export function DeleteSearchDialog({
  searchId,
  searchName,
  open,
  onOpenChange,
}: DeleteSearchDialogProps) {
  const deleteSearch = useDeleteSearch();

  async function handleConfirm() {
    try {
      await deleteSearch.mutateAsync(searchId);
      toast.success(`"${searchName}" deleted`);
      onOpenChange(false);
    } catch {
      toast.error("Could not delete this search");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete &ldquo;{searchName}&rdquo;?</DialogTitle>
          <DialogDescription>
            This cannot be undone. The search will stop being watched.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirm} disabled={deleteSearch.isPending}>
            {deleteSearch.isPending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
