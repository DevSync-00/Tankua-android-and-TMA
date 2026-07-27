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
            ? "bg-[#FFB800] text-[#0A1A2F]"
            : "text-white/70 hover:bg-white/10 hover:text-white"
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
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[#0A1A2F] text-white rounded-lg shadow-lg"
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
          "fixed left-0 top-0 bottom-0 w-64 bg-[#0A1A2F] flex flex-col z-50 transition-transform duration-300",
          "lg:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
      {/* Logo */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="w-10 h-10 rounded-xl bg-[#FFB800] flex items-center justify-center shadow-lg overflow-hidden">
            <Image src="/favicon.png" alt="Tankua" width={28} height={28} className="object-contain" />
          </div>
          <div>
            <span className="text-xl font-bold text-white">Tankua</span>
            <span className="block text-xs text-white/50">Provider Portal</span>
          </div>
        </Link>
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Main */}
        <div>
          <p className="px-4 text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
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
          <p className="px-4 text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
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
          <p className="px-4 text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
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
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
          <div className="w-10 h-10 rounded-full bg-[#FFB800] flex items-center justify-center text-white font-semibold">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Abyssinia Tours</p>
            <p className="text-xs text-emerald-400">● Active</p>
          </div>
        </div>
        <button className="w-full mt-3 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all">
          <LogOut className="h-5 w-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
    </>
  );
}

