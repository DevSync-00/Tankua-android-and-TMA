"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function MarketingFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin-portal") || pathname.startsWith("/provider-portal")) return null;

  return (
    <footer className="bg-[#121410] py-14 text-white/60">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12">
        <Link href="/" className="flex items-center gap-3 text-lg font-extrabold text-white">
          <Image src="/favicon.png" alt="Tankua" width={34} height={34} className="rounded-lg object-contain" />
          Tankua
        </Link>
        <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-7 gap-y-3 text-sm">
          <Link href="/tours" className="hover:text-white">Explore</Link>
          <Link href="/destinations" className="hover:text-white">Destinations</Link>
          <Link href="/about" className="hover:text-white">About</Link>
          <Link href="/contact" className="hover:text-white">Support</Link>
          <a href="https://provider.tankua.co" className="hover:text-white">Provider portal</a>
          <Link href="/privacy" className="hover:text-white">Privacy</Link>
          <Link href="/terms" className="hover:text-white">Terms</Link>
        </nav>
        <p className="text-sm">© {new Date().getFullYear()} Tankua</p>
      </div>
    </footer>
  );
}
