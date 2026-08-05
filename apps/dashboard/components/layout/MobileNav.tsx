"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Search, ShoppingBag, Wallet } from "lucide-react";
import { Sheet, SheetContent } from "../ui/sheet";
import { cn } from "../../utils/cn";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/listings", label: "Listings", icon: ShoppingBag },
  { href: "/searches", label: "Searches", icon: Search },
  { href: "/purchases", label: "Purchases", icon: Wallet },
];

export interface MobileNavProps {
  open: boolean;
  onOpenChange(open: boolean): void;
}

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left">
        <span className="mb-6 font-display text-sm font-semibold text-text-primary">
          Vinted <span className="text-accent-primary">Hunter</span>
        </span>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent-primary/10 text-accent-primary"
                    : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
