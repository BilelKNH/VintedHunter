"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Pagination } from "@/components/common/Pagination";
import { PurchasesTable } from "@/components/purchases/PurchasesTable";
import { usePurchases } from "@/hooks/usePurchases";

const PAGE_SIZE = 20;

export default function PurchasesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = usePurchases(page, PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-text-primary">Purchases</h1>
        <p className="text-sm text-text-secondary">
          Track what you&apos;ve bought, what it sold for, and what you actually made.
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : data && data.items.length > 0 ? (
        <>
          <PurchasesTable purchases={data.items} />
          <Pagination
            page={data.meta.page}
            limit={data.meta.limit}
            total={data.meta.total}
            onPageChange={setPage}
          />
        </>
      ) : (
        <EmptyState
          title="No purchases yet"
          description="Mark a listing as purchased from its detail page to start tracking your flips."
        />
      )}
    </div>
  );
}
