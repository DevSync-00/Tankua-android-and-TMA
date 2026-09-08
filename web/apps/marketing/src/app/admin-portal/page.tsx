import type { Metadata } from "next";
import Link from "next/link";
import { Lock, ShieldCheck, ArrowRight } from "lucide-react";
import { Badge, Button, Card } from "@tankua/ui";
import { adminPortalUrl } from "@/lib/portalUrls";

export const metadata: Metadata = {
  title: "Tankua Admin Portal",
  description: "Restricted admin portal access for Tankua staff.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function AdminPortalPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F3]">
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <Card className="p-8 md:p-10">
          <Badge className="mb-5 bg-[#A67C52]/10 text-[#8B6B47] border-[#A67C52]/20">
            Restricted Access
          </Badge>

          <div className="w-14 h-14 rounded-xl bg-[#A67C52]/10 text-[#A67C52] flex items-center justify-center mb-5">
            <Lock className="h-7 w-7" />
          </div>

          <h1 className="text-3xl font-bold text-[#4A3A2A] mb-3">
            Tankua Admin Portal
          </h1>
          <p className="text-[#4A3A2A]/70 mb-8">
            This page is protected and intended only for authorized Tankua staff.
          </p>

          <div className="flex items-center gap-3 text-[#4A3A2A]/80 mb-8">
            <ShieldCheck className="h-5 w-5 text-[#6B8E5A]" />
            <span>Authentication is required before access is granted.</span>
          </div>

          <Link href={adminPortalUrl}>
            <Button className="bg-[#A67C52] hover:bg-[#8B6B47] text-white">
              Continue to Admin Sign In
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </Card>
      </section>
    </main>
  );
}
