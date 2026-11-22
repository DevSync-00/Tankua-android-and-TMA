"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Phone,
  CreditCard,
  CheckCircle,
} from "lucide-react";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@tankua/ui";
import { createDriver } from "@/lib/queries";

export default function NewDriverPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    licenseNumber: "",
    emergencyContact: "",
  });

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("provider_user") || "{}");
      const id = stored.provider_id || stored.provider?.id;
      if (!id) return router.replace("/login");
      setProviderId(id);
    } catch { router.replace("/login"); }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerId) return setError("Please sign in again before adding a driver.");
    setError("");
    setSaving(true);
    const result = await createDriver({ provider_id: providerId, name: formData.name.trim(), phone: formData.phone.trim(), license_number: formData.licenseNumber.trim(), emergency_contact: formData.emergencyContact.trim() || undefined });
    setSaving(false);
    if (!result.success) return setError(result.error || "Could not add the driver.");
    router.push("/dashboard/drivers");
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Add New Driver"
        subtitle="Add a driver to your team"
        actions={
          <Link href="/dashboard/drivers">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Back to Drivers
            </Button>
          </Link>
        }
      />

      <div className="portal-content !max-w-4xl">
        <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-6">
          {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
          <Card>
            <CardHeader>
              <CardTitle>Driver Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    placeholder="Enter driver's full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phone Number *</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="tel"
                    required
                    placeholder="+251 9XX XXX XXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Driver's License Number *</label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    placeholder="e.g., AA-12345"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Emergency Contact</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="tel"
                    placeholder="+251 9XX XXX XXXX"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-4">
            <Link href="/dashboard/drivers">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" isLoading={saving} leftIcon={<CheckCircle className="h-4 w-4" />}>
              Add Driver
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

