"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Skeleton } from "../ui/skeleton";
import {
  useCancelPurchase,
  usePurchaseForListing,
  useRecordPurchase,
  useRecordSale,
} from "../../hooks/usePurchases";
import { formatPrice } from "../../utils/format";
import { ApiError } from "../../services/api-client";

export function PurchaseAction({
  listingId,
  price,
  currency,
}: {
  listingId: string;
  price: number;
  currency: string;
}) {
  const { data: purchase, isLoading } = usePurchaseForListing(listingId);
  const recordPurchase = useRecordPurchase();
  const recordSale = useRecordSale();
  const cancelPurchase = useCancelPurchase();

  const [purchasePriceDraft, setPurchasePriceDraft] = useState(String(price));
  const [sellingPriceDraft, setSellingPriceDraft] = useState("");

  if (isLoading) {
    return <Skeleton className="h-20 w-full" />;
  }

  function handleRecordPurchase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const purchasePrice = Number(purchasePriceDraft);
    if (!(purchasePrice > 0)) {
      toast.error("Enter a valid purchase price");
      return;
    }
    recordPurchase.mutate(
      { listingId, purchasePrice },
      {
        onSuccess: () => toast.success("Marked as purchased"),
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.message : "Something went wrong"),
      },
    );
  }

  function handleRecordSale(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!purchase) return;
    const sellingPrice = Number(sellingPriceDraft);
    if (!(sellingPrice > 0)) {
      toast.error("Enter a valid selling price");
      return;
    }
    recordSale.mutate(
      { purchaseId: purchase.id, sellingPrice },
      {
        onSuccess: (sold) => {
          const profit = sold.profit ?? 0;
          toast.success(
            profit >= 0
              ? `Sold — profit ${formatPrice(profit, currency)}`
              : `Sold — loss ${formatPrice(Math.abs(profit), currency)}`,
          );
        },
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.message : "Something went wrong"),
      },
    );
  }

  function handleCancel() {
    if (!purchase) return;
    cancelPurchase.mutate(purchase.id, {
      onSuccess: () => toast.success("Purchase cancelled"),
      onError: (err) =>
        toast.error(err instanceof ApiError ? err.message : "Something went wrong"),
    });
  }

  if (!purchase) {
    return (
      <form
        onSubmit={handleRecordPurchase}
        className="flex flex-col gap-2 rounded-md border border-border-default bg-bg-elevated p-3"
      >
        <Label htmlFor="purchasePrice" className="text-xs">
          I bought this — for how much?
        </Label>
        <div className="flex gap-2">
          <Input
            id="purchasePrice"
            type="number"
            min={0}
            step="0.01"
            value={purchasePriceDraft}
            onChange={(event) => setPurchasePriceDraft(event.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={recordPurchase.isPending}>
            {recordPurchase.isPending ? "Saving…" : "Mark as purchased"}
          </Button>
        </div>
      </form>
    );
  }

  if (purchase.status === "SOLD") {
    const profit = purchase.profit ?? 0;
    return (
      <div className="flex flex-col gap-1 rounded-md border border-border-default bg-bg-elevated p-3">
        <div className="flex items-center gap-2">
          <Badge variant={profit >= 0 ? "success" : "danger"}>
            {profit >= 0 ? "Profit" : "Loss"} {formatPrice(Math.abs(profit), currency)}
          </Badge>
        </div>
        <p className="text-xs text-text-tertiary">
          Bought {formatPrice(purchase.purchasePrice, currency)}, sold{" "}
          {formatPrice(purchase.sellingPrice ?? 0, currency)}
        </p>
      </div>
    );
  }

  // PENDING — owned, not yet resold.
  return (
    <div className="flex flex-col gap-2 rounded-md border border-border-default bg-bg-elevated p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-tertiary">
          Purchased for {formatPrice(purchase.purchasePrice, currency)}
        </p>
        <Button
          type="button"
          variant="ghost"
          className="h-auto p-0 text-xs text-danger hover:underline"
          onClick={handleCancel}
          disabled={cancelPurchase.isPending}
        >
          Cancel
        </Button>
      </div>
      <form onSubmit={handleRecordSale} className="flex gap-2">
        <Input
          type="number"
          min={0}
          step="0.01"
          placeholder="Sold for…"
          value={sellingPriceDraft}
          onChange={(event) => setSellingPriceDraft(event.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={recordSale.isPending}>
          {recordSale.isPending ? "Saving…" : "Mark as sold"}
        </Button>
      </form>
    </div>
  );
}
