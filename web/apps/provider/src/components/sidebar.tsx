"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck,
  Route,
  Users,
  Car,
  Wallet,
  Star,
  Settings,
  LogOut,
  ChevronRight,
  Bell,
  HelpCircle,
  BarChart3,
  X,
  MapPin,
} from "lucide-react";
import { cn } from "@tankua/ui";

const mainNavItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Bookings", href: "/dashboard/bookings", icon: CalendarCheck },
  { label: "My Trips", href: "/dashboard/trips", icon: Route },
  { label: "Pickup Stations", href: "/dashboard/pickup-stations", icon: MapPin },
  { label: "Drivers", href: "/dashboard/drivers", icon: Users },
  { label: "Vehicles", href: "/dashboard/vehicles", icon: Car },
];

const financeItems = [
  { label: "Earnings", href: "/dashboard/earnings", icon: Wallet },
  { label: "Reports", href: "/dashboard/reports", icon: BarChart3 },
];

const otherItems = [
  { label: "Reviews", href: "/dashboard/reviews", icon: Star },
  { label: "Support", href: "/dashboard/support", icon: HelpCircle },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [provider, setProvider] = useState({ name: "Your company", logo_url: "" });

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("provider_user") || "{}");
      const profile = stored.provider || stored;
      setProvider({
        name: profile.name || profile.company_name || "Your company",
        logo_url: profile.logo_url || "",
      });
    } catch {
      // Keep the neutral fallback for legacy sessions.
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
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white text-stone-800 border border-stone-200 rounded-xl shadow-sm"
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
          "fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-stone-200 flex flex-col z-50 transition-transform duration-300",
          "lg:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-stone-200 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center overflow-hidden">
            <Image src="/favicon.png" alt="Tankua" width={28} height={28} className="object-contain" />
          </div>
          <div>
            <span className="text-lg font-semibold text-stone-950">Tankua</span>
            <span className="block text-xs text-stone-500">Provider workspace</span>
          </div>
        </Link>
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden p-2 text-stone-500 hover:text-stone-950 hover:bg-stone-100 rounded-lg transition-colors"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Main */}
        <div>
          <p className="px-4 text-[10px] font-semibold text-stone-400 uppercase tracking-[0.16em] mb-2">
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
          <p className="px-4 text-[10px] font-semibold text-stone-400 uppercase tracking-[0.16em] mb-2">
            Finance
          </p>
          <div className="space-y-1">
            {financeItems.map((item) => (
              <NavItem key={item.href} item={item} />
            ))}
          </div>
        </div>

        {/* Other */}
        <div>
          <p className="px-4 text-[10px] font-semibold text-stone-400 uppercase tracking-[0.16em] mb-2">
            Other
          </p>
          <div className="space-y-1">
            {otherItems.map((item) => (
              <NavItem key={item.href} item={item} />
            ))}
          </div>
        </div>
      </nav>

      {/* Company */}
      <div className="p-4 border-t border-stone-200">
        <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-amber-100 font-semibold text-amber-950">
            {provider.logo_url ? (
              <img src={provider.logo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              provider.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold text-stone-900">{provider.name}</p>
            <p className="text-xs font-medium text-emerald-600">Active workspace</p>
          </div>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem("provider_user");
            localStorage.removeItem("provider_token");
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

