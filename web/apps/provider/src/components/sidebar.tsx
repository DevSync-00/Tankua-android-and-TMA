"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarCheck,
  Car,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Plus,
  Route,
  Settings,
  Star,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@tankua/ui";

const dashboardPath = "/dashboard";
const tripsPath = "/dashboard/trips";
const createTripPath = "/dashboard/trips/new";
const mobileNavigationId = "provider-mobile-navigation";

type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const navigationGroups: { label: string; items: NavigationItem[] }[] = [
  {
    label: "Operations",
    items: [
      { label: "Overview", href: dashboardPath, icon: LayoutDashboard },
      { label: "Trips", href: tripsPath, icon: Route },
      { label: "Bookings", href: "/dashboard/bookings", icon: CalendarCheck },
    ],
  },
  {
    label: "Fleet & logistics",
    items: [
      { label: "Pickup stations", href: "/dashboard/pickup-stations", icon: MapPin },
      { label: "Drivers", href: "/dashboard/drivers", icon: Users },
      { label: "Vehicles", href: "/dashboard/vehicles", icon: Car },
    ],
  },
  {
    label: "Business",
    items: [
      { label: "Earnings", href: "/dashboard/earnings", icon: Wallet },
      { label: "Reports", href: "/dashboard/reports", icon: BarChart3 },
      { label: "Reviews", href: "/dashboard/reviews", icon: Star },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
      { label: "Support", href: "/dashboard/support", icon: HelpCircle },
    ],
  },
];

const navigationItems = navigationGroups.flatMap(({ items }) => items);
const mobileNavigation = createContext<{ open: boolean; show: (trigger: HTMLButtonElement) => void } | null>(null);

export function getParentSection(pathname: string) {
  return navigationItems.find(({ href }) => href !== dashboardPath && pathname.startsWith(href + "/"));
}

export function ProviderNavigationButton() {
  const menu = useContext(mobileNavigation);
  if (!menu) return null;

  return (
    <button
      type="button"
      onClick={(event) => menu.show(event.currentTarget)}
      aria-label="Open provider navigation"
      aria-haspopup="dialog"
      aria-controls={mobileNavigationId}
      aria-expanded={menu.open}
      className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 lg:hidden"
    >
      <Menu aria-hidden="true" className="size-5" />
    </button>
  );
}

type Workspace = { name: string; logoUrl: string };

function NavigationPanel({
  pathname,
  workspace,
  onClose,
}: {
  pathname: string;
  workspace: Workspace;
  onClose?: () => void;
}) {
  const parentSection = getParentSection(pathname);
  const creatingTrip = pathname === createTripPath;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-20 shrink-0 items-center justify-between gap-2 border-b border-stone-200 px-4">
        <Link
          href={dashboardPath}
          onClick={onClose}
          className="flex min-w-0 items-center gap-3 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-600"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-amber-200 bg-amber-50">
            <Image src="/favicon.png" alt="" width={28} height={28} className="object-contain" />
          </span>
          <span className="min-w-0">
            <span className="block text-lg font-bold leading-tight tracking-tight text-stone-950">Tankua</span>
            <span className="block text-xs text-stone-600">Provider portal</span>
          </span>
        </Link>

        {onClose ? (
          <button
            type="button"
            autoFocus
            onClick={onClose}
            aria-label="Close provider navigation"
            className="grid size-10 shrink-0 place-items-center rounded-lg text-stone-600 hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-600"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        ) : null}
      </div>

      <nav aria-label="Provider navigation" className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-3 py-4">
        {navigationGroups.map(({ label, items }) => (
          <div key={label}>
            <p className="mb-1 px-2.5 text-xs font-semibold text-stone-600">{label}</p>
            <ul aria-label={label} className="space-y-0.5">
              {items.map(({ label, href, icon: Icon }) => {
                const exact = pathname === href;
                const active = exact || parentSection?.href === href;

                return (
                  <li
                    key={href}
                    className={cn(
                      "flex items-center gap-0.5 rounded-lg",
                      active ? "bg-amber-50 ring-1 ring-inset ring-amber-200" : "",
                    )}
                  >
                    <Link
                      href={href}
                      onClick={onClose}
                      aria-current={exact ? "page" : active && !creatingTrip ? "location" : undefined}
                      className={cn(
                        "flex min-h-10 min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-amber-600",
                        active ? "font-semibold text-stone-950" : "font-medium text-stone-700 hover:bg-stone-100 hover:text-stone-950",
                      )}
                    >
                      <Icon aria-hidden="true" className={cn("size-4 shrink-0", active ? "text-amber-800" : "text-stone-500")} />
                      <span>{label}</span>
                    </Link>

                    {href === tripsPath ? (
                      <Link
                        href={createTripPath}
                        onClick={onClose}
                        aria-current={creatingTrip ? "page" : undefined}
                        aria-label="Create trip"
                        title="Create trip"
                        className={cn(
                          "m-0.5 inline-flex h-9 shrink-0 items-center justify-center gap-1 rounded-md px-2 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-600 lg:w-9 lg:px-0",
                          creatingTrip ? "bg-amber-200" : "bg-amber-50",
                        )}
                      >
                        <Plus aria-hidden="true" className="size-4" />
                        <span className="lg:hidden">Create trip</span>
                      </Link>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="flex shrink-0 items-center gap-2 border-t border-stone-200 p-3">
        <div className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-stone-100 text-sm font-semibold text-stone-800">
          {workspace.logoUrl ? (
            <img src={workspace.logoUrl} alt="" className="size-full object-cover" />
          ) : (
            <span aria-hidden="true">{workspace.name.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight text-stone-950" title={workspace.name}>{workspace.name}</p>
          <p className="text-xs text-stone-600">Workspace</p>
        </div>
        <button
          type="button"
          onClick={() => {
            localStorage.removeItem("provider_user");
            localStorage.removeItem("provider_token");
            window.location.href = "/login";
          }}
          aria-label="Sign out"
          title="Sign out"
          className="grid size-10 shrink-0 place-items-center rounded-lg text-stone-600 hover:bg-stone-100 hover:text-stone-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-600"
        >
          <LogOut aria-hidden="true" className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function ProviderNavigation({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const [workspace, setWorkspace] = useState<Workspace>({ name: "Your company", logoUrl: "" });

  useEffect(() => {
    dialogRef.current?.close();
    try {
      const stored = JSON.parse(localStorage.getItem("provider_user") || "{}");
      const profile = stored.provider || stored;
      setWorkspace({
        name: profile.name || profile.company_name || "Your company",
        logoUrl: profile.logo_url || "",
      });
    } catch {
      setWorkspace({ name: "Your company", logoUrl: "" });
    }
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => {
      if (desktop.matches) dialogRef.current?.close();
    };
    desktop.addEventListener("change", closeOnDesktop);
    closeOnDesktop();

    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      desktop.removeEventListener("change", closeOnDesktop);
      document.body.style.overflow = oldOverflow;
    };
  }, [open]);

  const show = (trigger: HTMLButtonElement) => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    triggerRef.current = trigger;
    dialog.showModal();
    setOpen(true);
  };

  return (
    <mobileNavigation.Provider value={{ open, show }}>
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r border-stone-200 bg-white lg:block">
        <NavigationPanel pathname={pathname} workspace={workspace} />
      </aside>
      <dialog
        ref={dialogRef}
        id={mobileNavigationId}
        aria-label="Provider menu"
        onClose={() => {
          setOpen(false);
          triggerRef.current?.focus({ preventScroll: true });
          triggerRef.current = null;
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        className="fixed bottom-0 left-0 right-auto top-0 m-0 h-full max-h-none w-[min(20rem,90vw)] max-w-none border-0 bg-white p-0 text-stone-950 shadow-xl backdrop:bg-stone-950/50"
      >
        <NavigationPanel pathname={pathname} workspace={workspace} onClose={() => dialogRef.current?.close()} />
      </dialog>
      {children}
    </mobileNavigation.Provider>
  );
}
