import Link from "next/link";
import type { Purchase } from "@vinted-hunter/shared";
import { Badge, type BadgeProps } from "../ui/badge";
import { formatPrice, formatRelativeDate } from "../../utils/format";

const STATUS_VARIANT: Record<Purchase["status"], BadgeProps["variant"]> = {
  PENDING: "default",
  SOLD: "success",
  CANCELLED: "outline",
};

export function PurchasesTable({ purchases }: { purchases: Purchase[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border-default bg-bg-surface">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-border-default text-xs uppercase tracking-wide text-text-tertiary">
            <th className="px-4 py-3 font-medium">Listing</th>
            <th className="px-4 py-3 font-medium">Bought</th>
            <th className="px-4 py-3 font-medium">Sold</th>
            <th className="px-4 py-3 font-medium">Profit</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Date</th>
          </tr>
        </thead>
        <tbody>
          {purchases.map((purchase) => (
            <tr
              key={purchase.id}
              className="border-b border-border-default last:border-0 hover:bg-bg-elevated"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/listings/${purchase.listing.id}`}
                  className="font-medium text-text-primary hover:text-accent-primary hover:underline"
                >
                  {purchase.listing.title}
                </Link>
              </td>
              <td className="px-4 py-3 font-numeric text-text-secondary">
                {formatPrice(purchase.purchasePrice, purchase.listing.currency)}
              </td>
              <td className="px-4 py-3 font-numeric text-text-secondary">
                {purchase.sellingPrice != null
                  ? formatPrice(purchase.sellingPrice, purchase.listing.currency)
                  : "—"}
              </td>
              <td className="px-4 py-3 font-numeric">
                {purchase.profit != null ? (
                  <span className={purchase.profit >= 0 ? "text-accent-secondary" : "text-danger"}>
                    {purchase.profit >= 0 ? "+" : ""}
                    {formatPrice(purchase.profit, purchase.listing.currency)}
                  </span>
                ) : (
                  <span className="text-text-tertiary">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <Badge variant={STATUS_VARIANT[purchase.status]}>{purchase.status}</Badge>
              </td>
              <td className="px-4 py-3 text-xs text-text-tertiary">
                {formatRelativeDate(purchase.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
