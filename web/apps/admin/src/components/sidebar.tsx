"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck,
  MapPin,
  CreditCard,
  Ticket,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  Bell,
  HelpCircle,
  Gift,
  X,
  Shield,
  FileText,
} from "lucide-react";
import { cn } from "@tankua/ui";

const mainNavItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/dashboard/users", icon: Users },
  { label: "Providers", href: "/dashboard/providers", icon: Building2 },
  { label: "Applications", href: "/dashboard/provider-applications", icon: FileText },
  { label: "Bookings", href: "/dashboard/bookings", icon: CalendarCheck },
  { label: "Destinations", href: "/dashboard/destinations", icon: MapPin },
];

const financeItems = [
  { label: "Payments", href: "/dashboard/payments", icon: CreditCard },
  { label: "Payouts", href: "/dashboard/payouts", icon: Ticket },
  { label: "Reports", href: "/dashboard/reports", icon: BarChart3 },
];

const systemItems = [
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Promotions", href: "/dashboard/promotions", icon: Gift },
  { label: "Support", href: "/dashboard/support", icon: HelpCircle },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

const adminItems = [
  { label: "Admins", href: "/dashboard/admins", icon: Shield },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<any>(null);
  const isSuperAdmin = currentAdmin?.role === "super_admin";

  useEffect(() => {
    const adminData = localStorage.getItem("admin_user");
    if (adminData) {
      try {
        setCurrentAdmin(JSON.parse(adminData));
      } catch (e) {
        console.error("Failed to parse admin user", e);
      }
    }
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const NavItem = ({ item }: { item: typeof mainNavItems[0] }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
    
    return (
      <Link
        href={item.href}
        onClick={() => setIsMobileMenuOpen(false)}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-amber-50 text-stone-950 shadow-sm ring-1 ring-amber-200"
            : "text-stone-600 hover:bg-stone-100 hover:text-stone-950"
        )}
      >
        <item.icon className="h-5 w-5" />
        <span>{item.label}</span>
        {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-lg border border-stone-200 bg-white p-2 text-stone-900 shadow-lg lg:hidden"
        aria-label="Open menu"
      >
        <LayoutDashboard className="h-6 w-6" />
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed bottom-0 left-0 top-0 z-50 flex w-64 flex-col border-r border-stone-200 bg-white transition-transform duration-300",
          "lg:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
      {/* Logo */}
      <div className="flex items-center justify-between border-b border-stone-200 p-6">
        <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="w-10 h-10 rounded-xl bg-[#FFB800] flex items-center justify-center shadow-lg overflow-hidden">
            <Image src="/favicon.png" alt="Tankua" width={28} height={28} className="object-contain" priority />
          </div>
          <div>
            <span className="text-xl font-bold text-stone-950">Tankua</span>
            <span className="block text-xs text-stone-500">Admin workspace</span>
          </div>
        </Link>
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="rounded-lg p-2 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-950 lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto sidebar-scroll p-4 space-y-6">
        {/* Main */}
        <div>
          <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-stone-400">
            Main
          </p>
          <div className="space-y-1">
            {mainNavItems.map((item) => (
              <NavItem key={item.href} item={item} />
            ))}
          </div>
        </div>

        {/* Finance */}
        <div>
          <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-stone-400">
            Finance
          </p>
          <div className="space-y-1">
            {financeItems.map((item) => (
              <NavItem key={item.href} item={item} />
            ))}
          </div>
        </div>

        {/* System */}
        <div>
          <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-stone-400">
            System
          </p>
          <div className="space-y-1">
            {systemItems.map((item) => (
              <NavItem key={item.href} item={item} />
            ))}
          </div>
        </div>

        {/* Admin Management (Super Admin Only) */}
        {isSuperAdmin && (
          <div>
            <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-stone-400">
              Administration
            </p>
            <div className="space-y-1">
              {adminItems.map((item) => (
                <NavItem key={item.href} item={item} />
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* User */}
      <div className="border-t border-stone-200 p-4">
        <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 font-semibold text-amber-950">
            {(currentAdmin?.name || currentAdmin?.email || "A").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold text-stone-900">{currentAdmin?.name || "Administrator"}</p>
            <p className="truncate text-xs text-stone-500">{currentAdmin?.email || "Tankua admin"}</p>
          </div>
        </div>
        <button
          onClick={async () => {
            const { supabase } = await import("@/lib/supabase");
            await supabase.auth.signOut();
            localStorage.removeItem("admin_user");
            window.location.href = "/login";
          }}
          className="mt-3 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-950"
        >
          <LogOut className="h-5 w-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
    </>
  );
}

