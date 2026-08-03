import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";

export interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  onPageChange(page: number): void;
}

export function Pagination({ page, limit, total, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="font-numeric text-xs text-text-tertiary">
        Page {page} of {totalPages} &middot; {total} total
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
