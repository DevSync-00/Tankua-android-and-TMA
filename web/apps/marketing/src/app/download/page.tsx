"use client";

import Link from "next/link";
import Image from "next/image";
import { QrCode, CheckCircle2, Send } from "lucide-react";
import { Button, Card, Badge } from "@tankua/ui";
import { TELEGRAM_MINI_APP_URL } from "@/lib/telegram";

const features = [
  "Browse 250+ tours and destinations",
  "Book in minutes with secure payment",
  "Get instant QR code tickets",
  "Track your bookings and history",
  "Save favorite destinations",
  "Get real-time trip updates",
];

export default function DownloadPage() {
  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ffb800] to-[#ffc83d] flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <span className="text-xl font-bold text-[#181714]">Tankua</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/about" className="text-[#181714]/70 hover:text-[#181714]">About</Link>
              <Link href="/how-it-works" className="text-[#181714]/70 hover:text-[#181714]">How It Works</Link>
              <Link href="/tours" className="text-[#181714]/70 hover:text-[#181714]">Tours</Link>
              <Link href="/contact" className="text-[#181714]/70 hover:text-[#181714]">Contact</Link>
            </div>
            <Link href="/">
              <Button variant="ghost" size="sm">Back to Home</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-[#f7f5f0] to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <Badge className="mb-4">Use Tankua your way</Badge>
              <h1 className="text-5xl font-bold text-[#181714]">
                Open Tankua instantly
              </h1>
              <p className="text-xl text-[#181714]/70">
                Launch Tankua inside Telegram with no installation, or download the mobile app.
              </p>

              <div className="space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[#ffb800] flex-shrink-0" />
                    <span className="text-[#181714]/80">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <a
                  href={TELEGRAM_MINI_APP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <Button size="lg" className="w-full sm:w-auto bg-[#229ED9] hover:bg-[#1c8fc5] text-white">
                    <Send className="h-5 w-5 mr-2" />
                    Open in Telegram
                  </Button>
                </a>
                <a 
                  href="https://apps.apple.com/app/tankua" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <Button size="lg" className="w-full sm:w-auto">
                    <svg className="h-6 w-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    App Store
                  </Button>
                </a>
                <a 
                  href="https://play.google.com/store/apps/details?id=com.tankua.app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    <svg className="h-6 w-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 20.5v-17c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v17c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5zM16.5 12L6 3.5v17l10.5-8.5z"/>
                    </svg>
                    Google Play
                  </Button>
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="relative mx-auto w-[280px] h-[580px]">
                <div className="absolute inset-0 bg-[#181714] rounded-[3rem] shadow-2xl">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#181714] rounded-b-2xl" />
                  <div className="absolute inset-2 bg-white rounded-[2.5rem] overflow-hidden">
                    <div className="h-full bg-gradient-to-b from-[#181714] to-[#1a2d47] p-4">
                      <div className="text-center pt-8">
                        <Image src="/favicon.png" alt="Tankua" width={64} height={64} className="mx-auto mb-4 rounded-2xl object-contain" />
                        <h3 className="text-white font-semibold">Tankua</h3>
                        <p className="text-white/60 text-sm mt-2">Your adventure awaits</p>
                      </div>
                      
                      <div className="mt-8 space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="glass-card rounded-xl p-3 flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-[#ffb800]/20" />
                            <div className="flex-1">
                              <div className="h-3 bg-white/20 rounded w-3/4" />
                              <div className="h-2 bg-white/10 rounded w-1/2 mt-2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QR Code Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#ffb800]/10 flex items-center justify-center text-[#ffb800]">
            <QrCode className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-bold text-[#181714] mb-4">
            Scan to Download
          </h2>
          <p className="text-lg text-[#181714]/70 mb-8">
            Use your phone's camera to scan the QR code and download the app directly.
          </p>
          <Card className="inline-block p-8">
            <div className="w-48 h-48 bg-[#181714] rounded-lg flex items-center justify-center mb-4">
              <QrCode className="h-32 w-32 text-white" />
            </div>
            <p className="text-sm text-[#181714]/60">Scan with your phone camera</p>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#181714] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#ffb800] flex items-center justify-center">
                <span className="text-white font-bold">T</span>
              </div>
              <span className="text-white font-bold">Tankua</span>
            </div>
            <p className="text-white/50 text-sm">
              © {new Date().getFullYear()} Tankua. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
