"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Menu, Smartphone, X } from "lucide-react";
import { AppDownloadButton } from "@/components/AppDownloadButton";

type NavItem = { label: string; href: string };

function navLinks(): NavItem[] {
  return [
    { label: "Tours", href: "/tours" },
    { label: "Destinations", href: "/destinations" },
    { label: "Provider Portal", href: "/providers" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];
}

function isExternalHref(href: string) {
  return href.startsWith("http://") || href.startsWith("https://");
}

function navLinkActive(pathname: string, href: string) {
  if (isExternalHref(href)) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavAnchor({
  href,
  children,
  className,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  if (isExternalHref(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

function BoatLogo({ size = 34, className = "" }: { size?: number; className?: string }) {
  return (
    <Image src="/icon.jpg" alt="Tankua" width={size} height={size} className={`rounded-lg object-contain ${className}`} priority />
  );
}

export function MarketingNavbar() {
  const pathname = usePathname();
  const hideNav = pathname.startsWith("/admin-portal") || pathname.startsWith("/provider-portal");
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langLabel, setLangLabel] = useState("EN");

  const isHome = pathname === "/";

  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => setIsScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileMenuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  if (hideNav) return null;

  const transparent = isHome && !isScrolled;
  const solid = !transparent;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        solid
          ? "bg-[rgba(255,248,236,0.96)] backdrop-blur-sm border-b border-[rgba(245,168,0,0.2)] shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <motion.div whileHover={{ rotate: [-6, 6, 0], transition: { duration: 0.5, ease: "easeInOut" } }}>
              <BoatLogo size={34} />
            </motion.div>
            <span
              className={`font-syne font-extrabold text-lg tracking-tight transition-colors ${
                solid ? "text-brand-ink" : "text-white"
              }`}
            >
              Tankua
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-7">
            {navLinks().map((l) => {
              const active = navLinkActive(pathname, l.href);
              const cls = `text-[13px] font-medium transition-colors relative group ${
                active
                  ? solid
                    ? "text-brand-gold"
                    : "text-brand-gold-light"
                  : solid
                    ? "text-brand-muted hover:text-brand-ink"
                    : "text-white/80 hover:text-white"
              }`;
              return (
                <NavAnchor key={l.href} href={l.href} className={cls}>
                  {l.label}
                  <span
                    className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-[1.5px] rounded-full transition-all duration-200 bg-brand-gold ${
                      active ? "w-full opacity-100" : "w-0 opacity-0 group-hover:w-full group-hover:opacity-100"
                    }`}
                  />
                </NavAnchor>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              onClick={() => setLangLabel((p) => (p === "EN" ? "አማ" : "EN"))}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors border ${
                solid ? "text-brand-muted border-black/10 hover:bg-brand-sand" : "text-white/70 border-white/20 hover:text-white"
              }`}
              aria-label="Switch language"
            >
              <Globe className="h-3.5 w-3.5" />
              {langLabel}
            </button>
            <AppDownloadButton
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-[10px] text-[13px] font-medium transition-all ${
                solid
                  ? "bg-brand-gold/15 text-brand-ink border border-brand-gold/35 hover:bg-brand-gold/25"
                  : "bg-white/12 text-white border border-white/22 hover:bg-white/18"
              }`}
            >
              <Smartphone className="h-4 w-4 shrink-0 opacity-90" />
              Download the app
            </AppDownloadButton>
            <Link href="/login">
              <button
                type="button"
                className={`text-[13px] font-medium transition-colors ${solid ? "text-brand-ink hover:text-brand-gold" : "text-white/80 hover:text-white"}`}
              >
                Sign in
              </button>
            </Link>
          </div>

          <button
            type="button"
            className={`md:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors ${solid ? "text-brand-ink" : "text-white"}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="md:hidden fixed inset-0 top-0 bg-brand-dark z-50 flex flex-col px-6 py-8"
          >
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-2">
                <BoatLogo size={34} />
                <span className="font-syne font-extrabold text-lg text-white">Tankua</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-white/60 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-1 flex-1">
              {navLinks().map((l) => (
                <NavAnchor
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-3.5 font-syne font-bold text-xl border-b border-white/5 ${
                    navLinkActive(pathname, l.href) ? "text-brand-gold" : "text-white/80 hover:text-brand-gold"
                  }`}
                >
                  {l.label}
                </NavAnchor>
              ))}
            </nav>
            <div className="pt-8 flex flex-col gap-3">
              <AppDownloadButton
                className="w-full py-3 rounded-[10px] bg-brand-gold text-brand-ink font-medium text-[15px] inline-flex items-center justify-center gap-2 shadow-btn"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Smartphone className="h-5 w-5" />
                Download the app
              </AppDownloadButton>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <button type="button" className="w-full py-3 rounded-[10px] bg-brand-gold text-brand-ink font-medium text-[15px]">
                  Sign in
                </button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
