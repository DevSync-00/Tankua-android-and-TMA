"use client";

import { FormEvent, useEffect, useState } from "react";
import { MapPin, Plus, Trash2 } from "lucide-react";
import { Header } from "@/components/header";
import { Button, Card, ConfirmDialog } from "@tankua/ui";
import { supabase } from "@/lib/supabase";

type Station = {
  id: string; name: string; city: string | null; address: string | null;
  extra_price: number; is_active: boolean;
};
const emptyForm = { name: "", city: "", address: "", extraPrice: "0" };

export default function PickupStationsPage() {
  const [providerId, setProviderId] = useState<string | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("provider_user");
    if (!stored) { setLoading(false); return; }
    const parsed = JSON.parse(stored);
    const id = parsed?.provider_id || parsed?.provider?.id;
    setProviderId(id || null);
    if (id) loadStations(id); else setLoading(false);
  }, []);

  async function loadStations(id: string) {
    setLoading(true);
    const result = await supabase.from("pickup_stations").select("*")
      .eq("provider_id", id).order("name");
    if (result.error) setError(result.error.message);
    else setStations((result.data || []) as Station[]);
    setLoading(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!providerId) { setError("Please sign in again."); return; }
    const extraPrice = Number(form.extraPrice);
    if (!form.name.trim()) {
      setError("Station name is required."); return;
    }
    setSaving(true);
    const result = await supabase.from("pickup_stations").insert({
      provider_id: providerId, name: form.name.trim(), city: form.city.trim() || null,
      address: form.address.trim() || null, lat: 0, lng: 0,
      extra_price: Number.isFinite(extraPrice) ? extraPrice : 0, is_active: true,
    });
    if (result.error) setError(result.error.message);
    else { setForm(emptyForm); await loadStations(providerId); }
    setSaving(false);
  }

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  function removeStation(id: string) {
    setDeleteConfirmId(id);
  }

  async function executeRemove() {
    if (!deleteConfirmId) return;
    try {
      const result = await supabase.from("pickup_stations").delete().eq("id", deleteConfirmId);
      if (result.error) setError(result.error.message);
      else if (providerId) await loadStations(providerId);
    } finally {
      setDeleteConfirmId(null);
    }
  }

  return (
    <div className="min-h-screen">
      <Header title="Pickup Stations" subtitle="Manage the locations customers can select" />
      <div className="p-4 sm:p-6 space-y-6">
        <Card className="p-5">
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            {[
              ["name", "Station name *"], ["city", "City"], ["address", "Address"],
              ["extraPrice", "Default extra price (ETB)"],
            ].map(([key, label]) => (
              <label key={key} className="space-y-1 text-sm">
                <span className="font-medium">{label}</span>
                <input value={form[key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  type={key === "extraPrice" ? "number" : "text"}
                  step={key === "extraPrice" ? "0.01" : undefined}
                  className="w-full h-11 px-3 rounded-lg border bg-background" />
              </label>
            ))}
            {error && <p className="md:col-span-2 text-sm text-red-600">{error}</p>}
            <div className="md:col-span-2">
              <Button type="submit" disabled={saving} leftIcon={<Plus className="h-4 w-4" />}>
                {saving ? "Adding..." : "Add station"}
              </Button>
            </div>
          </form>
        </Card>
        {loading ? <p>Loading stations...</p> : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {stations.length === 0 && <p className="text-muted-foreground">No pickup stations yet.</p>}
            {stations.map((station) => (
              <Card key={station.id} className="p-5">
                <div className="flex justify-between gap-4">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" /> {station.name}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {[station.address, station.city].filter(Boolean).join(", ") || "No address"}
                    </p>
                    <p className="mt-2 text-sm">Extra: {Number(station.extra_price || 0)} ETB</p>
                  </div>
                  <button onClick={() => removeStation(station.id)} className="h-9 w-9 text-red-600"
                    aria-label="Delete station"><Trash2 className="h-4 w-4" /></button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        title="Delete Pickup Station"
        description="Are you sure you want to delete this pickup station? Existing trip links will be removed."
        confirmText="Delete Station"
        cancelText="Cancel"
        variant="danger"
        onConfirm={executeRemove}
      />
    </div>
  );
}
