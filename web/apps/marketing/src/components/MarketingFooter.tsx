"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { providerRegisterUrl } from "@/lib/portalUrls";
import { TELEGRAM_MINI_APP_URL } from "@/lib/telegram";

export function MarketingFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin-portal") || pathname.startsWith("/provider-portal")) return null;

  return (
    <footer className="tankua-footer">
      <div className="tankua-wrap">
        <div className="tankua-footer-grid">
          <div className="tankua-footer-intro">
            <Link href="/" className="tankua-brand" aria-label="Tankua home">
              <Image src="/favicon.png" alt="" width={35} height={35} /> Tankua
            </Link>
            <p>Tours and weekend plans across Ethiopia.</p>
          </div>
          <nav aria-label="Explore">
            <h2>Explore</h2>
            <Link href="/tours">Tours</Link>
            <Link href="/destinations">Destinations</Link>
            <Link href="/weekend">Weekend planner</Link>
            <Link href="/guides">Travel guides</Link>
          </nav>
          <nav aria-label="Tankua information">
            <h2>Tankua</h2>
            <Link href="/about">About</Link>
            <Link href="/how-it-works">How it works</Link>
            <Link href="/contact">Support</Link>
            <a href={TELEGRAM_MINI_APP_URL} target="_blank" rel="noopener noreferrer">Open in Telegram <ArrowUpRight size={15} aria-hidden="true" /></a>
          </nav>
          <nav aria-label="Provider resources">
            <h2>For operators</h2>
            <Link href="/provider-portal">Provider portal</Link>
            <a href={providerRegisterUrl}>Apply as a provider <ArrowUpRight size={15} aria-hidden="true" /></a>
          </nav>
        </div>
        <div className="tankua-footer-legal">
          <p>© {new Date().getFullYear()} Tankua</p>
          <div><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
        </div>
      </div>
    </footer>
  );
}
