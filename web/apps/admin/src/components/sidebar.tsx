"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3, Bell, Building2, CalendarCheck, CalendarDays, CreditCard, FileText,
  Gift, HelpCircle, LayoutDashboard, LogOut, MapPin, Menu, Settings, Shield, Ticket, Users, X,
} from "lucide-react";

const groups = [
  {
    label: "Operations",
    items: [
      { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { label: "Bookings", href: "/dashboard/bookings", icon: CalendarCheck },
      { label: "Applications", href: "/dashboard/provider-applications", icon: FileText },
      { label: "Providers", href: "/dashboard/providers", icon: Building2 },
      { label: "Destinations", href: "/dashboard/destinations", icon: MapPin },
      { label: "Weekend events", href: "/dashboard/weekend-events", icon: CalendarDays },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Payments", href: "/dashboard/payments", icon: CreditCard },
      { label: "Payouts", href: "/dashboard/payouts", icon: Ticket },
      { label: "Reports", href: "/dashboard/reports", icon: BarChart3 },
    ],
  },
  {
    label: "Workspace",
    items: [
      { label: "Users", href: "/dashboard/users", icon: Users },
      { label: "Support", href: "/dashboard/support", icon: HelpCircle },
      { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
      { label: "Promotions", href: "/dashboard/promotions", icon: Gift },
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

type AdminAccount = { name?: string; email?: string; role?: string };
const OpenAdminNavigation = createContext<(() => void) | null>(null);

export function AdminMenuButton() {
  const openNavigation = useContext(OpenAdminNavigation);
  if (!openNavigation) return null;

  return (
    <button type="button" className="admin-icon-button lg:hidden" onClick={openNavigation} aria-label="Open navigation" aria-haspopup="dialog" aria-controls="admin-mobile-navigation">
      <Menu size={21} aria-hidden="true" />
    </button>
  );
}

function Rail({ account, close }: { account: AdminAccount; close?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  const navigation = account.role === "super_admin"
    ? groups.map((group) => group.label === "Workspace"
      ? { ...group, items: [...group.items, { label: "Admins", href: "/dashboard/admins", icon: Shield }] }
      : group)
    : groups;

  async function signOut() {
    const { supabase } = await import("@/lib/supabase");
    await supabase.auth.signOut();
    localStorage.removeItem("admin_user");
    close?.();
    router.replace("/login");
  }

  return (
    <div className="admin-rail">
      <div className="admin-rail-top">
        <Link href="/dashboard" className="admin-brand" onClick={close}>
          <span className="admin-brand-mark"><Image src="/favicon.png" alt="" width={34} height={34} priority /></span>
          <span><strong>Tankua</strong><small>Admin workspace</small></span>
        </Link>
        {close && (
          <button type="button" autoFocus className="admin-rail-close" onClick={close} aria-label="Close navigation">
            <X size={19} aria-hidden="true" />
          </button>
        )}
      </div>
      <nav className="admin-rail-links" aria-label="Admin navigation">
        {navigation.map(({ label, items }) => (
          <div key={label}>
            <p className="admin-rail-group">{label}</p>
            {items.map(({ label: itemLabel, href, icon: Icon }) => {
              const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));
              return (
                <Link key={href} href={href} onClick={close} className="admin-nav-link" aria-current={active ? "page" : undefined}>
                  <Icon size={17} aria-hidden="true" />{itemLabel}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <button type="button" className="admin-nav-link admin-rail-signout" onClick={signOut}>
        <LogOut size={17} aria-hidden="true" />Sign out
      </button>
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [account, setAccount] = useState<AdminAccount>({});

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("admin_user") || "{}");
      setAccount(stored ?? {});
    } catch {
      // Keep navigation usable if the legacy cache is unreadable.
    }
  }, []);

  useEffect(() => {
    dialogRef.current?.close();
  }, [pathname]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => {
      if (desktop.matches) dialogRef.current?.close();
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  return (
    <OpenAdminNavigation.Provider value={() => dialogRef.current?.showModal()}>
      <a href="#admin-main" className="admin-skip-link">Skip to content</a>
      <aside className="admin-desktop-rail"><Rail account={account} /></aside>
      <dialog
        ref={dialogRef}
        id="admin-mobile-navigation"
        aria-label="Admin navigation"
        className="admin-nav-dialog"
        onClick={(event) => {
          if (event.currentTarget === event.target) dialogRef.current?.close();
        }}
      >
        <Rail account={account} close={() => dialogRef.current?.close()} />
      </dialog>
      <main id="admin-main" className="admin-main" tabIndex={-1}>{children}</main>
    </OpenAdminNavigation.Provider>
  );
}
