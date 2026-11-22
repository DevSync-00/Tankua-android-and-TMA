"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Car,
  Users,
  Calendar,
  CreditCard,
  CheckCircle,
} from "lucide-react";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@tankua/ui";
import { createVehicle } from "@/lib/queries";

export default function NewVehiclePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    plate: "",
    capacity: "",
    year: "",
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
    if (!providerId) return setError("Please sign in again before adding a vehicle.");
    setError("");
    setSaving(true);
    const parts = formData.name.trim().split(/\s+/);
    const result = await createVehicle({ provider_id: providerId, vehicle_type: formData.type, plate_number: formData.plate.trim().toUpperCase(), capacity: Number(formData.capacity), year: Number(formData.year), make: parts.shift(), model: parts.join(" ") || undefined });
    setSaving(false);
    if (!result.success) return setError(result.error || "Could not add the vehicle.");
    router.push("/dashboard/vehicles");
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Add New Vehicle"
        subtitle="Register a vehicle in your fleet"
        actions={
          <Link href="/dashboard/vehicles">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Back to Vehicles
            </Button>
          </Link>
        }
      />

      <div className="portal-content !max-w-4xl">
        <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-6">
          {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Vehicle Type *</label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-background"
                >
                  <option value="">Select type</option>
                  <option value="minibus">Minibus (15-20 seats)</option>
                  <option value="van">Van / Coaster (15-30 seats)</option>
                  <option value="bus">Bus (45-50 seats)</option>
                  <option value="suv">SUV</option>
                  <option value="sedan">Sedan</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Vehicle Name/Model *</label>
                <div className="relative">
                  <Car className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    placeholder="e.g., Toyota Coaster"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Plate Number *</label>
                  <div className="relative">
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="text"
                      required
                      placeholder="e.g., AA-12345"
                      value={formData.plate}
                      onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Year *</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="number"
                      required
                      min="2000"
                      max={new Date().getFullYear() + 1}
                      placeholder="e.g., 2022"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Seating Capacity *</label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="number"
                    required
                    min="5"
                    max="100"
                    placeholder="e.g., 45"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>

            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-4">
            <Link href="/dashboard/vehicles">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" isLoading={saving} leftIcon={<CheckCircle className="h-4 w-4" />}>
              Add Vehicle
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

