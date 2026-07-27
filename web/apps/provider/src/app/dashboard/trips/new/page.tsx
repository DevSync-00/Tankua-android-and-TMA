"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  CreditCard,
  CheckCircle,
} from "lucide-react";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@tankua/ui";
import { supabase } from "@/lib/supabase";

export default function NewTripPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [providerName, setProviderName] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [destinations, setDestinations] = useState<Array<{ id: string; name: string; city?: string; region?: string; category?: string }>>([]);
  const [loadingDestinations, setLoadingDestinations] = useState(true);
  const [pickupStations, setPickupStations] = useState<Array<{ id: string; name: string; city: string | null; address: string | null; extra_price: number }>>([]);
  const [stationConfig, setStationConfig] = useState<Record<string, { selected: boolean; pickupTime: string; extraPrice: string }>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [formData, setFormData] = useState({
    destinationId: "",
    tripType: "round_trip",
    departureDate: "",
    departureTime: "06:00",
    returnDate: "",
    price: "",
    maxSeats: "",
    tourCategory: "",
    itinerary: "",
  });

  useEffect(() => {
    const loadProviderSession = () => {
      try {
        const stored = localStorage.getItem("provider_user");
        if (!stored) {
          router.replace("/login");
          return;
        }

        const parsed = JSON.parse(stored);
        const id = parsed?.provider_id || parsed?.provider?.id;

        if (!id) {
          router.replace("/login");
          return;
        }

        setProviderId(id);
        setProviderName(parsed?.provider?.name || parsed?.name || "");
      } catch (err) {
        console.error("Failed to load provider session", err);
        setErrorMessage("Please sign in again to create a trip.");
      } finally {
        setAuthChecked(true);
      }
    };

    loadProviderSession();
  }, [router]);

  // Reset return date when switching to one way
  useEffect(() => {
    if (formData.tripType === "one_way" && formData.returnDate) {
      setFormData((prev) => ({ ...prev, returnDate: "" }));
    }
  }, [formData.tripType, formData.returnDate]);

  useEffect(() => {
    loadDestinations();
  }, [selectedCategory]);

  useEffect(() => {
    if (!providerId) return;
    supabase.from("pickup_stations").select("id,name,city,address,extra_price")
      .eq("provider_id", providerId).eq("is_active", true).order("name")
      .then(({ data, error }) => {
        if (error) setErrorMessage(error.message);
        else setPickupStations(data || []);
      });
  }, [providerId]);

  const loadDestinations = async () => {
    try {
      setLoadingDestinations(true);
      // Try destinations table first
      let query = supabase
        .from('destinations')
        .select('id, name, city, region, category')
        .order('name', { ascending: true });

      if (selectedCategory !== "all") {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDestinations(data || []);
    } catch (error) {
      console.error('Error loading destinations:', error);
    } finally {
      setLoadingDestinations(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!providerId) {
      setErrorMessage("Please sign in to create a trip.");
      router.replace("/login");
      return;
    }

    if (!formData.destinationId) {
      setErrorMessage("Select a destination to continue.");
      return;
    }

    if (!formData.departureDate || !formData.departureTime) {
      setErrorMessage("Add a departure date and time.");
      return;
    }

    if (formData.tripType === "round_trip" && !formData.returnDate) {
      setErrorMessage("Add a return date for round trips.");
      return;
    }

    const priceValue = Number(formData.price);
    const seatsValue = Number(formData.maxSeats);

    if (!Number.isFinite(priceValue) || priceValue <= 0) {
      setErrorMessage("Enter a valid price greater than 0.");
      return;
    }

    if (!Number.isFinite(seatsValue) || seatsValue <= 0) {
      setErrorMessage("Enter the maximum seats available.");
      return;
    }

    const selectedStations = pickupStations.filter((station) => stationConfig[station.id]?.selected);
    if (!selectedStations.length) {
      setErrorMessage("Select at least one pickup station for this trip.");
      return;
    }
    if (selectedStations.some((station) => !stationConfig[station.id]?.pickupTime)) {
      setErrorMessage("Add a pickup time for every selected station.");
      return;
    }

    const departureDate = new Date(`${formData.departureDate}T${formData.departureTime}:00`);
    if (Number.isNaN(departureDate.getTime())) {
      setErrorMessage("Departure date/time is invalid.");
      return;
    }

    const returnDate =
      formData.tripType === "round_trip" && formData.returnDate
        ? new Date(`${formData.returnDate}T${formData.departureTime}:00`)
        : null;

    setSaving(true);
    
    try {
      const tripData = {
        provider_id: providerId,
        destination_id: formData.destinationId,
        trip_type: formData.tripType,
        departure_date: departureDate.toISOString(),
        return_date: returnDate ? returnDate.toISOString() : undefined,
        price: priceValue,
        max_seats: seatsValue,
        tour_category: formData.tourCategory || undefined,
        itinerary: formData.itinerary?.trim() || undefined,
        pickup_stations: selectedStations.map((station) => ({
          station_id: station.id,
          pickup_time: stationConfig[station.id].pickupTime,
          extra_price: Number(stationConfig[station.id].extraPrice || station.extra_price || 0),
        })),
      };

      // Import and use the createTrip function
      const { createTrip } = await import("@/lib/queries");
      const result = await createTrip(tripData);
      
      if (result.success) {
        router.push("/dashboard/trips");
      } else {
        setErrorMessage(result.error || "Failed to create trip");
      }
    } catch (error) {
      console.error("Error creating trip:", error);
      setErrorMessage("Failed to create trip. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen">
        <Header
          title="Create New Trip"
          subtitle="Loading your provider session..."
          actions={
            <Link href="/dashboard/trips">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                Back to Trips
              </Button>
            </Link>
          }
        />
        <div className="p-6">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-6 text-muted-foreground">Preparing the trip form…</CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Create New Trip"
        subtitle={
          providerName
            ? `Add a new trip for ${providerName}`
            : "Add a new trip to your schedule"
        }
        actions={
          <Link href="/dashboard/trips">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Back to Trips
            </Button>
          </Link>
        }
      />

      <div className="p-6">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
          {errorMessage && (
            <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm">
              {errorMessage}
            </div>
          )}
          {/* Destination */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Destination
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Choose from Tankua-curated trips and set your own schedule and price.
              </p>
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">Filter by Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-background"
                >
                  <option value="all">All Categories</option>
                  <option value="religious">Religious Heritage</option>
                  <option value="historical">Historical</option>
                  <option value="nature">Nature</option>
                  <option value="adventure">Adventure</option>
                  <option value="cultural">Cultural</option>
                  <option value="monument">Monuments</option>
                  <option value="park">Parks</option>
                  <option value="museum">Museums</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Select Destination *</label>
                {loadingDestinations ? (
                  <div className="w-full px-4 py-3 rounded-xl border border-border bg-muted/50 text-muted-foreground">
                    Loading destinations...
                  </div>
                ) : (
                  <select
                    required
                    value={formData.destinationId}
                    onChange={(e) => setFormData({ ...formData, destinationId: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-background"
                  >
                    <option value="">Select a destination</option>
                    {destinations.map((dest) => (
                      <option key={dest.id} value={dest.id}>
                        {dest.name} {dest.city ? `(${dest.city})` : dest.region ? `(${dest.region})` : ''} {dest.category ? `- ${dest.category}` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Trip Type *</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tripType: "round_trip" })}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.tripType === "round_trip"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <p className="font-semibold">Round Trip</p>
                    <p className="text-sm text-muted-foreground">Departure and return</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tripType: "one_way" })}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.tripType === "one_way"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <p className="font-semibold">One Way</p>
                    <p className="text-sm text-muted-foreground">Departure only</p>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Departure Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.departureDate}
                    onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Departure Time *</label>
                  <input
                    type="time"
                    required
                    value={formData.departureTime}
                    onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>

              {formData.tripType === "round_trip" && (
                <div>
                  <label className="block text-sm font-medium mb-2">Return Date *</label>
                  <input
                    type="date"
                    required={formData.tripType === "round_trip"}
                    value={formData.returnDate}
                    onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Pickup Stations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Select every station available for this trip, then set its pickup time and optional surcharge.
              </p>
              {!pickupStations.length ? (
                <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  No active stations yet. <Link className="text-primary font-medium" href="/dashboard/pickup-stations">Create pickup stations first.</Link>
                </div>
              ) : pickupStations.map((station) => {
                const config = stationConfig[station.id] || { selected: false, pickupTime: "", extraPrice: String(station.extra_price || 0) };
                return <div key={station.id} className={`rounded-xl border p-4 ${config.selected ? "border-primary bg-primary/5" : "border-border"}`}>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={config.selected} className="mt-1"
                      onChange={(e) => setStationConfig((current) => ({ ...current, [station.id]: { ...config, selected: e.target.checked } }))}/>
                    <span className="flex-1"><b className="block">{station.name}</b><small className="text-muted-foreground">{[station.address,station.city].filter(Boolean).join(", ")}</small></span>
                  </label>
                  {config.selected && <div className="grid grid-cols-2 gap-3 mt-3 pl-6">
                    <label className="text-sm">Pickup time *<input type="time" value={config.pickupTime}
                      onChange={(e) => setStationConfig((current) => ({ ...current, [station.id]: { ...config, pickupTime: e.target.value } }))}
                      className="mt-1 w-full px-3 py-2 rounded-lg border bg-background"/></label>
                    <label className="text-sm">Extra price (ETB)<input type="number" min="0" value={config.extraPrice}
                      onChange={(e) => setStationConfig((current) => ({ ...current, [station.id]: { ...config, extraPrice: e.target.value } }))}
                      className="mt-1 w-full px-3 py-2 rounded-lg border bg-background"/></label>
                  </div>}
                </div>;
              })}
            </CardContent>
          </Card>

          {/* Trip Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Trip Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tour Category</label>
                <select
                  value={formData.tourCategory}
                  onChange={(e) => setFormData({ ...formData, tourCategory: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-background"
                >
                  <option value="">Select a category (optional)</option>
                  <option value="day_trip">Day Trip</option>
                  <option value="weekend">Weekend</option>
                  <option value="multi_day">Multi-day</option>
                  <option value="holiday">Holiday</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Itinerary / Important details</label>
                <textarea
                  rows={4}
                  value={formData.itinerary}
                  onChange={(e) => setFormData({ ...formData, itinerary: e.target.value })}
                  placeholder="Add pickup notes, highlights, inclusions, or other details travelers should know."
                  className="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-background resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Capacity & Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Capacity & Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Maximum Seats *</label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="number"
                      required
                      min="1"
                      max="100"
                      placeholder="e.g., 45"
                      value={formData.maxSeats}
                      onChange={(e) => setFormData({ ...formData, maxSeats: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Price per Seat (ETB) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">ETB</span>
                    <input
                      type="number"
                      required
                      min="100"
                      placeholder="e.g., 2500"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full pl-14 pr-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <Link href="/dashboard/trips">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" isLoading={saving} leftIcon={<CheckCircle className="h-4 w-4" />}>
              Create Trip
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

