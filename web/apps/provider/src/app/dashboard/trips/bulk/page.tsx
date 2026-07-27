"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Users,
  Copy,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@tankua/ui";
import { supabase } from "@/lib/supabase";
import { createTrip, getProviderTrips, type TripDetails } from "@/lib/queries";

interface TripTemplate {
  destinationId: string;
  destinationName: string;
  tripType: string;
  departureTime: string;
  price: string;
  maxSeats: string;
  tourCategory: string;
  itinerary: string;
}

interface BulkTrip {
  id: string;
  destinationId: string;
  destinationName: string;
  tripType: string;
  departureDate: string;
  departureTime: string;
  returnDate: string;
  price: string;
  maxSeats: string;
  tourCategory: string;
  itinerary: string;
  errors?: string[];
}

export default function BulkTripPage() {
  const router = useRouter();
  const [providerId, setProviderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [destinations, setDestinations] = useState<Array<{ id: string; name: string }>>([]);
  const [existingTrips, setExistingTrips] = useState<TripDetails[]>([]);
  const [bulkTrips, setBulkTrips] = useState<BulkTrip[]>([]);
  const [template, setTemplate] = useState<TripTemplate>({
    destinationId: "",
    destinationName: "",
    tripType: "round_trip",
    departureTime: "06:00",
    price: "",
    maxSeats: "",
    tourCategory: "",
    itinerary: "",
  });
  const [mode, setMode] = useState<"template" | "duplicate" | "manual">("template");
  const [selectedTripToDuplicate, setSelectedTripToDuplicate] = useState<string>("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [recurringDays, setRecurringDays] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadProviderSession();
  }, [router]);

  useEffect(() => {
    if (providerId) {
      loadDestinations();
      loadExistingTrips();
    }
  }, [providerId]);

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
      setLoading(false);
    } catch (err) {
      console.error("Failed to load provider session", err);
      router.replace("/login");
    }
  };

  const loadDestinations = async () => {
    try {
      const { data, error } = await supabase
        .from('destinations')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) throw error;
      setDestinations(data || []);
    } catch (error) {
      console.error('Error loading destinations:', error);
    }
  };

  const loadExistingTrips = async () => {
    if (!providerId) return;
    try {
      const result = await getProviderTrips(providerId, { limit: 100 });
      setExistingTrips(result.trips);
    } catch (error) {
      console.error('Error loading trips:', error);
    }
  };

  const generateTripsFromTemplate = () => {
    if (!template.destinationId || !dateRange.start || !dateRange.end) {
      setErrorMessage("Please fill in destination, start date, and end date");
      return;
    }

    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    const trips: BulkTrip[] = [];
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    if (recurringDays.length > 0) {
      // Generate trips for specific days of week
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dayName = daysOfWeek[currentDate.getDay()];
        if (recurringDays.includes(dayName)) {
          const returnDate = template.tripType === "round_trip" 
            ? new Date(currentDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            : "";

          trips.push({
            id: `temp-${Date.now()}-${trips.length}`,
            destinationId: template.destinationId,
            destinationName: template.destinationName,
            tripType: template.tripType,
            departureDate: currentDate.toISOString().split('T')[0],
            departureTime: template.departureTime,
            returnDate,
            price: template.price,
            maxSeats: template.maxSeats,
            tourCategory: template.tourCategory,
            itinerary: template.itinerary,
          });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else {
      // Generate trips for all days in range
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const returnDate = template.tripType === "round_trip" 
          ? new Date(currentDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          : "";

        trips.push({
          id: `temp-${Date.now()}-${trips.length}`,
          destinationId: template.destinationId,
          destinationName: template.destinationName,
          tripType: template.tripType,
          departureDate: currentDate.toISOString().split('T')[0],
          departureTime: template.departureTime,
          returnDate,
          price: template.price,
          maxSeats: template.maxSeats,
          tourCategory: template.tourCategory,
          itinerary: template.itinerary,
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    setBulkTrips(trips);
    setErrorMessage(null);
  };

  const duplicateTrip = () => {
    if (!selectedTripToDuplicate) {
      setErrorMessage("Please select a trip to duplicate");
      return;
    }

    const trip = existingTrips.find(t => t.id === selectedTripToDuplicate);
    if (!trip) {
      setErrorMessage("Selected trip not found");
      return;
    }

    if (!dateRange.start || !dateRange.end) {
      setErrorMessage("Please select a date range");
      return;
    }

    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    const trips: BulkTrip[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const returnDate = trip.trip_type === "round_trip"
        ? new Date(currentDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : "";

      trips.push({
        id: `temp-${Date.now()}-${trips.length}`,
        destinationId: trip.destination_id || "",
        destinationName: trip.destination?.name || "",
        tripType: trip.trip_type,
        departureDate: currentDate.toISOString().split('T')[0],
        departureTime: trip.departure_date ? new Date(trip.departure_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : "06:00",
        returnDate,
        price: trip.price?.toString() || "",
        maxSeats: trip.max_seats?.toString() || "",
        tourCategory: trip.tour_category || "",
        itinerary: trip.itinerary || "",
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    setBulkTrips(trips);
    setErrorMessage(null);
  };

  const addManualTrip = () => {
    setBulkTrips([
      ...bulkTrips,
      {
        id: `temp-${Date.now()}-${bulkTrips.length}`,
        destinationId: "",
        destinationName: "",
        tripType: "round_trip",
        departureDate: "",
        departureTime: "06:00",
        returnDate: "",
        price: "",
        maxSeats: "",
        tourCategory: "",
        itinerary: "",
      },
    ]);
  };

  const removeTrip = (id: string) => {
    setBulkTrips(bulkTrips.filter(t => t.id !== id));
  };

  const updateTrip = (id: string, field: string, value: string) => {
    setBulkTrips(bulkTrips.map(trip => {
      if (trip.id === id) {
        const updated = { ...trip, [field]: value };
        if (field === 'destinationId') {
          const dest = destinations.find(d => d.id === value);
          updated.destinationName = dest?.name || "";
        }
        if (field === 'tripType' && value === 'one_way') {
          updated.returnDate = "";
        }
        return updated;
      }
      return trip;
    }));
  };

  const validateTrips = (): boolean => {
    let isValid = true;
    const updatedTrips = bulkTrips.map(trip => {
      const errors: string[] = [];
      
      if (!trip.destinationId) errors.push("Destination required");
      if (!trip.departureDate) errors.push("Departure date required");
      if (!trip.departureTime) errors.push("Departure time required");
      if (trip.tripType === "round_trip" && !trip.returnDate) errors.push("Return date required for round trips");
      if (!trip.price || Number(trip.price) <= 0) errors.push("Valid price required");
      if (!trip.maxSeats || Number(trip.maxSeats) <= 0) errors.push("Valid seat count required");

      if (errors.length > 0) isValid = false;

      return { ...trip, errors };
    });

    setBulkTrips(updatedTrips);
    return isValid;
  };

  const handleSubmit = async () => {
    if (bulkTrips.length === 0) {
      setErrorMessage("Please add at least one trip");
      return;
    }

    if (!validateTrips()) {
      setErrorMessage("Please fix all errors before submitting");
      return;
    }

    if (!providerId) {
      setErrorMessage("Provider session expired. Please sign in again.");
      router.replace("/login");
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      let successCount = 0;
      let failCount = 0;

      for (const trip of bulkTrips) {
        const departureDate = new Date(`${trip.departureDate}T${trip.departureTime}:00`);
        const returnDate = trip.returnDate ? new Date(`${trip.returnDate}T${trip.departureTime}:00`) : undefined;

        const result = await createTrip({
          provider_id: providerId,
          destination_id: trip.destinationId,
          trip_type: trip.tripType,
          departure_date: departureDate.toISOString(),
          return_date: returnDate?.toISOString(),
          price: Number(trip.price),
          max_seats: Number(trip.maxSeats),
          tour_category: trip.tourCategory || undefined,
          itinerary: trip.itinerary || undefined,
        });

        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      }

      if (successCount > 0) {
        setSuccessMessage(`Successfully created ${successCount} trip(s)${failCount > 0 ? `. ${failCount} failed.` : ''}`);
        setTimeout(() => {
          router.push("/dashboard/trips");
        }, 2000);
      } else {
        setErrorMessage(`Failed to create trips. Please try again.`);
      }
    } catch (error) {
      console.error("Error creating bulk trips:", error);
      setErrorMessage("Failed to create trips. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header title="Bulk Create Trips" subtitle="Loading..." />
        <div className="p-6">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Bulk Create Trips"
        subtitle="Create multiple trips at once"
        actions={
          <Link href="/dashboard/trips">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Back to Trips
            </Button>
          </Link>
        }
      />

      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {errorMessage && (
          <Card className="border-red-500 bg-red-50">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-red-700">{errorMessage}</p>
            </CardContent>
          </Card>
        )}

        {successMessage && (
          <Card className="border-green-500 bg-green-50">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <p className="text-green-700">{successMessage}</p>
            </CardContent>
          </Card>
        )}

        {/* Mode Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Creation Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button
                variant={mode === "template" ? "default" : "outline"}
                onClick={() => setMode("template")}
              >
                Template
              </Button>
              <Button
                variant={mode === "duplicate" ? "default" : "outline"}
                onClick={() => setMode("duplicate")}
              >
                Duplicate Existing
              </Button>
              <Button
                variant={mode === "manual" ? "default" : "outline"}
                onClick={() => setMode("manual")}
              >
                Manual Entry
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Template Mode */}
        {mode === "template" && (
          <Card>
            <CardHeader>
              <CardTitle>Create from Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Destination *</label>
                  <select
                    value={template.destinationId}
                    onChange={(e) => {
                      const dest = destinations.find(d => d.id === e.target.value);
                      setTemplate({ ...template, destinationId: e.target.value, destinationName: dest?.name || "" });
                    }}
                    className="w-full h-11 px-4 rounded-xl bg-muted/50 border border-border text-sm"
                  >
                    <option value="">Select destination</option>
                    {destinations.map(dest => (
                      <option key={dest.id} value={dest.id}>{dest.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Trip Type *</label>
                  <select
                    value={template.tripType}
                    onChange={(e) => setTemplate({ ...template, tripType: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl bg-muted/50 border border-border text-sm"
                  >
                    <option value="round_trip">Round Trip</option>
                    <option value="one_way">One Way</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Departure Time *</label>
                  <input
                    type="time"
                    value={template.departureTime}
                    onChange={(e) => setTemplate({ ...template, departureTime: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl bg-muted/50 border border-border text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Price (ETB) *</label>
                  <input
                    type="number"
                    value={template.price}
                    onChange={(e) => setTemplate({ ...template, price: e.target.value })}
                    placeholder="500"
                    className="w-full h-11 px-4 rounded-xl bg-muted/50 border border-border text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Max Seats *</label>
                  <input
                    type="number"
                    value={template.maxSeats}
                    onChange={(e) => setTemplate({ ...template, maxSeats: e.target.value })}
                    placeholder="30"
                    className="w-full h-11 px-4 rounded-xl bg-muted/50 border border-border text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tour Category</label>
                  <input
                    type="text"
                    value={template.tourCategory}
                    onChange={(e) => setTemplate({ ...template, tourCategory: e.target.value })}
                    placeholder="Optional"
                    className="w-full h-11 px-4 rounded-xl bg-muted/50 border border-border text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Itinerary</label>
                <textarea
                  value={template.itinerary}
                  onChange={(e) => setTemplate({ ...template, itinerary: e.target.value })}
                  placeholder="Optional itinerary details..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date *</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl bg-muted/50 border border-border text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">End Date *</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl bg-muted/50 border border-border text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Recurring Days (Optional)</label>
                <div className="flex flex-wrap gap-2">
                  {['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map(day => (
                    <Button
                      key={day}
                      variant={recurringDays.includes(day) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setRecurringDays(prev =>
                          prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
                        );
                      }}
                    >
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Leave empty to create trips for all days in range
                </p>
              </div>

              <Button onClick={generateTripsFromTemplate} className="w-full">
                Generate Trips
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Duplicate Mode */}
        {mode === "duplicate" && (
          <Card>
            <CardHeader>
              <CardTitle>Duplicate Existing Trip</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Trip to Duplicate *</label>
                <select
                  value={selectedTripToDuplicate}
                  onChange={(e) => setSelectedTripToDuplicate(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-muted/50 border border-border text-sm"
                >
                  <option value="">Select a trip</option>
                  {existingTrips.map(trip => (
                    <option key={trip.id} value={trip.id}>
                      {trip.destination?.name || "Unnamed destination"} - {trip.departure_date ? new Date(trip.departure_date).toLocaleDateString() : 'TBD'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date *</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl bg-muted/50 border border-border text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">End Date *</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl bg-muted/50 border border-border text-sm"
                  />
                </div>
              </div>

              <Button onClick={duplicateTrip} className="w-full">
                Generate Duplicates
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Manual Mode */}
        {mode === "manual" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Manual Trip Entry</CardTitle>
              <Button variant="outline" size="sm" onClick={addManualTrip} leftIcon={<Plus className="h-4 w-4" />}>
                Add Trip
              </Button>
            </CardHeader>
            <CardContent>
              {bulkTrips.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No trips added yet. Click "Add Trip" to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bulkTrips.map((trip, index) => (
                    <Card key={trip.id} className={trip.errors && trip.errors.length > 0 ? "border-red-500" : ""}>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Trip {index + 1}</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTrip(trip.id)}
                          leftIcon={<Trash2 className="h-4 w-4" />}
                        >
                          Remove
                        </Button>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {trip.errors && trip.errors.length > 0 && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            {trip.errors.map((error, i) => (
                              <p key={i} className="text-sm text-red-700">{error}</p>
                            ))}
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Destination *</label>
                            <select
                              value={trip.destinationId}
                              onChange={(e) => updateTrip(trip.id, 'destinationId', e.target.value)}
                              className="w-full h-11 px-4 rounded-xl bg-muted/50 border border-border text-sm"
                            >
                              <option value="">Select destination</option>
                              {destinations.map(dest => (
                                <option key={dest.id} value={dest.id}>{dest.name}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">Trip Type *</label>
                            <select
                              value={trip.tripType}
                              onChange={(e) => updateTrip(trip.id, 'tripType', e.target.value)}
                              className="w-full h-11 px-4 rounded-xl bg-muted/50 border border-border text-sm"
                            >
                              <option value="round_trip">Round Trip</option>
                              <option value="one_way">One Way</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">Departure Date *</label>
                            <input
                              type="date"
                              value={trip.departureDate}
                              onChange={(e) => updateTrip(trip.id, 'departureDate', e.target.value)}
                              className="w-full h-11 px-4 rounded-xl bg-muted/50 border border-border text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">Departure Time *</label>
                            <input
                              type="time"
                              value={trip.departureTime}
                              onChange={(e) => updateTrip(trip.id, 'departureTime', e.target.value)}
                              className="w-full h-11 px-4 rounded-xl bg-muted/50 border border-border text-sm"
                            />
                          </div>

                          {trip.tripType === "round_trip" && (
                            <div>
                              <label className="block text-sm font-medium mb-2">Return Date *</label>
                              <input
                                type="date"
                                value={trip.returnDate}
                                onChange={(e) => updateTrip(trip.id, 'returnDate', e.target.value)}
                                className="w-full h-11 px-4 rounded-xl bg-muted/50 border border-border text-sm"
                              />
                            </div>
                          )}

                          <div>
                            <label className="block text-sm font-medium mb-2">Price (ETB) *</label>
                            <input
                              type="number"
                              value={trip.price}
                              onChange={(e) => updateTrip(trip.id, 'price', e.target.value)}
                              className="w-full h-11 px-4 rounded-xl bg-muted/50 border border-border text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">Max Seats *</label>
                            <input
                              type="number"
                              value={trip.maxSeats}
                              onChange={(e) => updateTrip(trip.id, 'maxSeats', e.target.value)}
                              className="w-full h-11 px-4 rounded-xl bg-muted/50 border border-border text-sm"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Preview and Submit */}
        {bulkTrips.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Preview ({bulkTrips.length} trips)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {bulkTrips.map((trip, index) => (
                  <div key={trip.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">
                        {trip.destinationName || "Unknown"} - {trip.departureDate} at {trip.departureTime}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {trip.tripType === "round_trip" ? "Round Trip" : "One Way"} • {trip.maxSeats} seats • {trip.price} ETB
                      </p>
                    </div>
                    {trip.errors && trip.errors.length > 0 && (
                      <Badge variant="destructive">Errors</Badge>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-4">
                <Button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex-1"
                  leftIcon={saving ? undefined : <CheckCircle className="h-4 w-4" />}
                  isLoading={saving}
                >
                  {saving ? "Creating Trips..." : `Create ${bulkTrips.length} Trip(s)`}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setBulkTrips([])}
                  disabled={saving}
                >
                  Clear All
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
