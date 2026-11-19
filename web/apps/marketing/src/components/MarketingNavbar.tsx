"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { TELEGRAM_MINI_APP_URL } from "@/lib/telegram";

const links = [
  { href: "/tours", label: "Tours" },
  { href: "/destinations", label: "Destinations" },
  { href: "/weekend", label: "Weekend planner" },
  { href: "/guides", label: "Travel guides" },
];

// These pages already reserve space for the original fixed site header.
const fixedHeaderRoutes = new Set(["/about", "/contact", "/download", "/faq", "/how-it-works", "/login", "/privacy", "/terms"]);

export function MarketingNavbar() {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const menuOpen = openPath === pathname;
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpenPath(null);
      menuButton.current?.focus();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  if (pathname.startsWith("/admin-portal") || pathname.startsWith("/provider-portal")) return null;

  return (
    <header className={`tankua-header${fixedHeaderRoutes.has(pathname) ? " tankua-header-fixed" : ""}`}>
      <div className="tankua-wrap tankua-header-inner">
        <Link href="/" className="tankua-brand" aria-label="Tankua home" onClick={() => setOpenPath(null)}>
          <Image src="/favicon.png" alt="" width={35} height={35} priority />
          <span>Tankua</span>
        </Link>
        <button
          ref={menuButton}
          type="button"
          className="tankua-menu-button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-controls="tankua-navigation"
          aria-expanded={menuOpen}
          onClick={() => setOpenPath(menuOpen ? null : pathname)}
        >
          {menuOpen ? <X size={23} aria-hidden="true" /> : <Menu size={23} aria-hidden="true" />}
        </button>
        <nav id="tankua-navigation" className={`tankua-navigation${menuOpen ? " is-open" : ""}`} aria-label="Main navigation">
          <div className="tankua-nav-links">
            {links.map(({ href, label }) => (
              <Link key={href} href={href} aria-current={pathname === href || pathname.startsWith(`${href}/`) ? "page" : undefined} onClick={() => setOpenPath(null)}>{label}</Link>
            ))}
          </div>
          <div className="tankua-nav-actions">
            <Link href="/providers" aria-current={pathname === "/providers" ? "page" : undefined} onClick={() => setOpenPath(null)}>For providers</Link>
            <Link href="/login" aria-current={pathname === "/login" ? "page" : undefined} onClick={() => setOpenPath(null)}>Sign in</Link>
            <a href={TELEGRAM_MINI_APP_URL} target="_blank" rel="noopener noreferrer" className="tankua-button tankua-telegram" onClick={() => setOpenPath(null)}>
              Open in Telegram <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
