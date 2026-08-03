"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Menu, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { useAuthStore } from "../../stores/auth-store";
import * as authService from "../../services/auth.service";
import { MobileNav } from "./MobileNav";

export function AppTopbar() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clear = useAuthStore((state) => state.clear);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  async function handleLogout() {
    try {
      await authService.logout();
    } catch {
      // even if the server call fails, clear the local session below
    } finally {
      clear();
      toast.message("Logged out");
      router.push("/login");
    }
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border-default bg-bg-surface px-4 md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setMobileNavOpen(true)}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
      <span className="font-display text-sm font-medium text-text-secondary md:hidden">
        Vinted <span className="text-accent-primary">Hunter</span>
      </span>
      <div className="ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-primary/15 text-accent-primary">
                <UserIcon className="h-4 w-4" />
              </span>
              <span className="hidden text-sm text-text-primary sm:inline">
                {user?.firstname ?? user?.email ?? "Account"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout} className="text-danger focus:text-danger">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
