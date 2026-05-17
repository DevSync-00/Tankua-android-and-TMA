"use client";

import Link from "next/link";
import { Home, Search, ArrowLeft } from "lucide-react";
import { Button } from "@tankua/ui";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#F8F6F0] to-white flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-[#D4A017] mb-4">404</h1>
          <h2 className="text-4xl font-bold text-[#0A1A2F] mb-4">
            Page Not Found
          </h2>
          <p className="text-lg text-[#0A1A2F]/70 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link href="/">
            <Button size="lg" className="bg-[#D4A017] hover:bg-[#B8860B]">
              <Home className="h-5 w-5 mr-2" />
              Go Home
            </Button>
          </Link>
          <Link href="/tours">
            <Button variant="outline" size="lg">
              <Search className="h-5 w-5 mr-2" />
              Browse Tours
            </Button>
          </Link>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 text-left">
          <div>
            <h3 className="font-semibold text-[#0A1A2F] mb-2">Popular Pages</h3>
            <ul className="space-y-1 text-sm text-[#0A1A2F]/70">
              <li><Link href="/tours" className="hover:text-[#D4A017]">Tours</Link></li>
              <li><Link href="/destinations" className="hover:text-[#D4A017]">Destinations</Link></li>
              <li><Link href="/providers" className="hover:text-[#D4A017]">For Providers</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-[#0A1A2F] mb-2">Help</h3>
            <ul className="space-y-1 text-sm text-[#0A1A2F]/70">
              <li><Link href="/faq" className="hover:text-[#D4A017]">FAQ</Link></li>
              <li><Link href="/contact" className="hover:text-[#D4A017]">Contact</Link></li>
              <li><Link href="/how-it-works" className="hover:text-[#D4A017]">How It Works</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-[#0A1A2F] mb-2">Legal</h3>
            <ul className="space-y-1 text-sm text-[#0A1A2F]/70">
              <li><Link href="/privacy" className="hover:text-[#D4A017]">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-[#D4A017]">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
