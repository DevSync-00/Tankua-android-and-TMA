"use client";

import { FormEvent, useEffect, useState } from "react";
import { MapPin, Plus, Trash2 } from "lucide-react";
import { Header } from "@/components/header";
import { Button, Card } from "@tankua/ui";
import { supabase } from "@/lib/supabase";

type Station = {
  id: string; name: string; city: string | null; address: string | null;
  lat: number; lng: number; extra_price: number; is_active: boolean;
};
const emptyForm = { name: "", city: "", address: "", lat: "", lng: "", extraPrice: "0" };

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
    const lat = Number(form.lat), lng = Number(form.lng), extraPrice = Number(form.extraPrice);
    if (!form.name.trim() || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      setError("Name, latitude, and longitude are required."); return;
    }
    setSaving(true);
    const result = await supabase.from("pickup_stations").insert({
      provider_id: providerId, name: form.name.trim(), city: form.city.trim() || null,
      address: form.address.trim() || null, lat, lng,
      extra_price: Number.isFinite(extraPrice) ? extraPrice : 0, is_active: true,
    });
    if (result.error) setError(result.error.message);
    else { setForm(emptyForm); await loadStations(providerId); }
    setSaving(false);
  }

  async function removeStation(id: string) {
    if (!confirm("Delete this pickup station? Existing trip links will also be removed.")) return;
    const result = await supabase.from("pickup_stations").delete().eq("id", id);
    if (result.error) setError(result.error.message);
    else if (providerId) await loadStations(providerId);
  }

  return (
    <div className="min-h-screen">
      <Header title="Pickup Stations" subtitle="Manage the locations customers can select" />
      <div className="p-4 sm:p-6 space-y-6">
        <Card className="p-5">
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            {[
              ["name", "Station name *"], ["city", "City"], ["address", "Address"],
              ["lat", "Latitude *"], ["lng", "Longitude *"], ["extraPrice", "Default extra price (ETB)"],
            ].map(([key, label]) => (
              <label key={key} className="space-y-1 text-sm">
                <span className="font-medium">{label}</span>
                <input value={form[key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  type={["lat", "lng", "extraPrice"].includes(key) ? "number" : "text"}
                  step={key === "extraPrice" ? "0.01" : ["lat", "lng"].includes(key) ? "any" : undefined}
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
                    <p className="mt-1 text-xs text-muted-foreground">{station.lat}, {station.lng}</p>
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
    </div>
  );
}
