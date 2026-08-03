"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { SearchTable } from "@/components/searches/SearchTable";
import { useSearches } from "@/hooks/useSearches";

export default function SearchesPage() {
  const { data: searches, isLoading, isError, refetch } = useSearches();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-text-primary">Searches</h1>
          <p className="text-sm text-text-secondary">Configure what the hunter should watch for.</p>
        </div>
        <Button asChild>
          <Link href="/searches/new">
            <Plus className="mr-1.5 h-4 w-4" />
            New search
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : searches && searches.length > 0 ? (
        <SearchTable searches={searches} />
      ) : (
        <EmptyState
          title="No searches yet"
          description="Create your first search to start watching for opportunities."
          action={{ href: "/searches/new", label: "New search" }}
        />
      )}
    </div>
  );
}
