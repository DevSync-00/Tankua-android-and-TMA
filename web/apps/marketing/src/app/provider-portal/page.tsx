import Link from "next/link";
import { Building2, ArrowRight, CheckCircle2, LayoutDashboard } from "lucide-react";
import { Badge, Button, Card } from "@tankua/ui";
import { providerPortalUrl, providerRegisterUrl } from "@/lib/portalUrls";

export default function ProviderPortalPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F3]">
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-10">
          <Badge className="mb-4 bg-[#A67C52]/10 text-[#8B6B47] border-[#A67C52]/20">
            Tankua Providers Portal
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-[#4A3A2A] mb-4">
            Manage Your Tours on Tankua
          </h1>
          <p className="text-lg text-[#4A3A2A]/70 max-w-3xl mx-auto">
            Access your provider dashboard to manage trips, bookings, vehicles, drivers, and payouts.
          </p>
        </div>

        <Card className="p-8 mb-8">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div>
              <div className="w-14 h-14 rounded-xl bg-[#A67C52]/10 text-[#A67C52] flex items-center justify-center mb-4">
                <LayoutDashboard className="h-7 w-7" />
              </div>
              <h2 className="text-2xl font-semibold text-[#4A3A2A] mb-3">
                Existing Provider
              </h2>
              <p className="text-[#4A3A2A]/70 mb-6">
                Sign in to your portal and continue managing your business.
              </p>
              <Link href={providerPortalUrl}>
                <Button className="bg-[#A67C52] hover:bg-[#8B6B47] text-white">
                  Open Providers Portal
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div>
              <div className="w-14 h-14 rounded-xl bg-[#6B8E5A]/10 text-[#6B8E5A] flex items-center justify-center mb-4">
                <Building2 className="h-7 w-7" />
              </div>
              <h2 className="text-2xl font-semibold text-[#4A3A2A] mb-3">
                New Provider
              </h2>
              <p className="text-[#4A3A2A]/70 mb-6">
                Apply as a partner and get listed for travelers across Ethiopia.
              </p>
              <Link href={providerRegisterUrl}>
                <Button variant="outline" className="border-[#A67C52]/30 text-[#4A3A2A]">
                  Register as Provider
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        <div className="grid sm:grid-cols-2 gap-4">
          {[
            "Trip and schedule management",
            "Real-time booking visibility",
            "Driver and vehicle management",
            "Payout and earnings tracking",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-[#4A3A2A]/80">
              <CheckCircle2 className="h-5 w-5 text-[#A67C52]" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
