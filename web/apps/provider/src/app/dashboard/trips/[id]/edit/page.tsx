"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, MapPin } from "lucide-react";
import { Header } from "@/components/header";
import { Button, Card, getTripCurrency, type TripCurrency } from "@tankua/ui";
import { supabase } from "@/lib/supabase";
import { getProviderTrip, replaceTripPickupStations, updateTrip, updateTripStatus } from "@/lib/queries";
import { getTripDateParts, parseTripTime } from "@/lib/trip-schedule";

type Station = { id: string; name: string; city: string | null; address: string | null; extra_price: number };
type StationValue = { selected: boolean; pickupTime: string; extraPrice: string };
type SavedTripState = {
  status: string;
  currency: TripCurrency;
  tripType: string;
  departureAt: number;
  departureDate: string;
  departureTime: string;
  returnAt: number | null;
  returnDate: string;
  returnTime: string;
  maxSeats: string;
  minimumInterest: number | null;
  interestCount: number;
};

export default function EditTripPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [providerId,setProviderId]=useState("");
  const [destinations,setDestinations]=useState<Array<{id:string;name:string}>>([]);
  const [stations,setStations]=useState<Station[]>([]);
  const [stationConfig,setStationConfig]=useState<Record<string,StationValue>>({});
  const [form,setForm]=useState({destinationId:"",tripType:"round_trip",departureDate:"",departureTime:"",returnDate:"",returnTime:"",price:"",maxSeats:"",tourCategory:"",itinerary:"",status:"upcoming"});
  const [savedTrip, setSavedTrip] = useState<SavedTripState | null>(null);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const currency = savedTrip?.currency ?? "ETB";

  const isCollectingInterest = savedTrip?.status === "collecting_interest";
  const cancelledBeforeGoal = savedTrip?.status === "cancelled"
    && savedTrip.minimumInterest !== null
    && savedTrip.interestCount < savedTrip.minimumInterest;
  const activationLocked = isCollectingInterest || cancelledBeforeGoal;
  const statusDescription = form.status === "upcoming"
    ? "Travelers can reserve seats. Mark the trip Active to open payments."
    : form.status === "active" && savedTrip?.status === "upcoming"
      ? "Travelers can pay once you save this trip as Active."
      : null;

  useEffect(()=>{
    const stored=localStorage.getItem("provider_user");
    if(!stored){router.replace("/login");return;}
    const parsed=JSON.parse(stored);
    const pid=parsed?.provider_id||parsed?.provider?.id;
    if(!pid){router.replace("/login");return;}
    setProviderId(pid);
    Promise.all([
      supabase.from("destinations").select("id,name").order("name"),
      supabase.from("pickup_stations").select("id,name,city,address,extra_price").eq("provider_id",pid).eq("is_active",true).order("name"),
      getProviderTrip(pid,id),
    ]).then(([destinationResult,stationResult,tripResult])=>{
      if(destinationResult.error||stationResult.error||tripResult.error||!tripResult.trip){
        setError(destinationResult.error?.message||stationResult.error?.message||tripResult.error||"Trip not found."); return;
      }
      setDestinations(destinationResult.data||[]);
      setStations((stationResult.data||[]) as Station[]);
      const trip:any=tripResult.trip;
      const departureIso = trip.departure_date || trip.date || "";
      const departure = getTripDateParts(departureIso);
      const returnSchedule = getTripDateParts(trip.return_date || "");
      const loadedForm = {
        destinationId:trip.destination_id||"", tripType:trip.trip_type||"round_trip",
        departureDate: departure.date, departureTime: departure.time,
        returnDate: returnSchedule.date, returnTime: returnSchedule.time,
        price:String(trip.price||""), maxSeats:String(trip.max_seats||""), tourCategory:trip.tour_category||"",
        itinerary:trip.itinerary||"", status:trip.status||"upcoming",
      };
      setForm(loadedForm);
      setSavedTrip({
        status: loadedForm.status,
        currency: getTripCurrency(trip.currency),
        tripType: loadedForm.tripType,
        departureAt: Date.parse(departureIso),
        departureDate: loadedForm.departureDate,
        departureTime: loadedForm.departureTime,
        returnAt: trip.return_date ? Date.parse(trip.return_date) : null,
        returnDate: loadedForm.returnDate,
        returnTime: loadedForm.returnTime,
        maxSeats: loadedForm.maxSeats,
        minimumInterest: trip.minimum_interest ?? null,
        interestCount: trip.interest_count ?? 0,
      });
      const links:Record<string,StationValue>={};
      (tripResult.stations as any[]).forEach(link=>{links[link.station_id]={selected:true,pickupTime:link.pickup_time||"",extraPrice:String(link.extra_price||0)};});
      setStationConfig(links);
    }).finally(()=>setLoading(false));
  },[id,router]);

  async function submit(event:FormEvent){
    event.preventDefault(); setError("");
    if (!savedTrip) return;
    const selected=stations.filter(station=>stationConfig[station.id]?.selected);
    if(!selected.length){setError("Select at least one pickup station.");return;}
    if(selected.some(station=>!stationConfig[station.id]?.pickupTime)){setError("Add a pickup time for every selected station.");return;}
    const departure = parseTripTime(form.departureDate, form.departureTime);
    if (!departure) { setError("Enter a valid departure date and time."); return; }
    const departureChanged = form.departureDate !== savedTrip.departureDate || form.departureTime !== savedTrip.departureTime;
    const tripTypeChanged = form.tripType !== savedTrip.tripType;
    const returnChanged = form.returnDate !== savedTrip.returnDate || form.returnTime !== savedTrip.returnTime;
    const activating = form.status === "active" && savedTrip.status === "upcoming";
    const departureAt = departureChanged ? departure.getTime() : savedTrip.departureAt;
    let returnDate: string | null | undefined;
    if (form.tripType === "round_trip" && (returnChanged || departureChanged || tripTypeChanged)) {
      const returnSchedule = parseTripTime(form.returnDate, form.returnTime);
      const returnAt = returnChanged ? returnSchedule?.getTime() : savedTrip.returnAt;
      if (!returnSchedule || returnAt == null || !(returnAt > departureAt)) {
        setError("Choose a return date and time after departure.");
        return;
      }
      if (returnChanged) returnDate = returnSchedule.toISOString();
    } else if (form.tripType === "one_way" && tripTypeChanged) {
      returnDate = null;
    }
    if (activating && departureAt <= Date.now()) {
      setError("Choose a future departure to activate this trip.");
      return;
    }
    if (isCollectingInterest && form.status === "collecting_interest" && departureChanged && departure.getTime() <= Date.now()) {
      setError("Choose a future departure for a trip collecting interest.");
      return;
    }
    setSaving(true);
    const tripResult=await updateTrip(id,{
      destination_id:form.destinationId,trip_type:form.tripType,departure_date:departureChanged ? departure.toISOString() : undefined,
      return_date: returnDate,
      price:Number(form.price),max_seats:form.maxSeats !== savedTrip.maxSeats ? Number(form.maxSeats) : undefined,tour_category:form.tourCategory||undefined,
      itinerary:form.itinerary.trim()||undefined,status:!activating && form.status !== savedTrip.status ? form.status : undefined,
    }, activationLocked || activating ? savedTrip.status : undefined);
    if(!tripResult.success){setError(tripResult.error||"Could not update trip.");setSaving(false);return;}
    const stationResult=await replaceTripPickupStations(id,selected.map(station=>({
      station_id:station.id,pickup_time:stationConfig[station.id].pickupTime,
      extra_price:Number(stationConfig[station.id].extraPrice || 0),
    })));
    if(!stationResult.success){setError(stationResult.error||"Trip updated, but pickup stations could not be saved.");setSaving(false);return;}
    if (activating) {
      const activation = await updateTripStatus(id, "active", "upcoming");
      if (!activation.success) {
        setError(`Trip details saved. ${activation.error || "Payments could not be opened."}`);
        setSaving(false);
        return;
      }
    }
    router.push("/dashboard/trips"); router.refresh();
  }

  if(loading)return <div><Header title="Edit Trip" subtitle="Loading trip…"/><p className="p-6">Loading…</p></div>;
  return <div className="min-h-screen">
    <Header title="Edit Trip" subtitle="Update schedule, capacity, pricing, and pickup stations" actions={<Link href="/dashboard/trips"><Button variant="outline" size="sm" leftIcon={<ArrowLeft className="h-4 w-4"/>}>Back to Trips</Button></Link>}/>
    <form onSubmit={submit} className="portal-form p-4 sm:p-6 lg:p-8">
      {error&&<div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>}
      <Card className="p-5 grid md:grid-cols-2 gap-4">
        <label>Destination *<select required value={form.destinationId} onChange={e=>setForm({...form,destinationId:e.target.value})} className="mt-1 w-full px-3 py-3 rounded-xl border bg-background">{destinations.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>Trip type<select value={form.tripType} onChange={e=>setForm({...form,tripType:e.target.value})} className="mt-1 w-full px-3 py-3 rounded-xl border bg-background"><option value="round_trip">Round trip</option><option value="one_way">One way</option></select></label>
        <label>Departure date *<input required type="date" value={form.departureDate} onChange={e=>setForm({...form,departureDate:e.target.value})} className="mt-1 w-full px-3 py-3 rounded-xl border"/></label>
        <label>Departure time (EAT) *<input required type="time" value={form.departureTime} onChange={e=>setForm({...form,departureTime:e.target.value})} className="mt-1 w-full px-3 py-3 rounded-xl border"/></label>
        {form.tripType === "round_trip" ? (
          <>
            <label>Return date *<input required type="date" value={form.returnDate} onChange={e=>setForm({...form,returnDate:e.target.value})} className="mt-1 w-full px-3 py-3 rounded-xl border"/></label>
            <label>Return time (EAT) *<input required type="time" value={form.returnTime} onChange={e=>setForm({...form,returnTime:e.target.value})} className="mt-1 w-full px-3 py-3 rounded-xl border"/></label>
          </>
        ) : null}
        <div>
          <label htmlFor="trip-status">Status</label>
          <select
            id="trip-status"
            value={form.status}
            onChange={(event) => setForm({ ...form, status: event.target.value })}
            className="mt-1 w-full px-3 py-3 rounded-xl border bg-background"
            aria-describedby={statusDescription ? "trip-status-description" : undefined}
          >
            {isCollectingInterest && <option value="collecting_interest">Collecting interest</option>}
            {!activationLocked && (
              <>
                {(savedTrip?.status === "active" || savedTrip?.status === "upcoming") && <option value="active">Active</option>}
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </>
            )}
            <option value="cancelled">Cancelled</option>
          </select>
          {statusDescription && (
            <p id="trip-status-description" className="mt-1 text-sm text-muted-foreground">
              {statusDescription}
            </p>
          )}
        </div>
        {savedTrip?.minimumInterest != null && (
          <div className="md:col-span-2 rounded-xl border bg-muted/30 p-4">
            <p className="text-sm font-medium">
              {savedTrip.interestCount.toLocaleString()} / {savedTrip.minimumInterest.toLocaleString()} interested
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {isCollectingInterest
                ? "Reservations open automatically when the interest goal is reached before departure. Mark the trip Active when you are ready to accept payment."
                : "The interest goal was set when the trip was created."}
            </p>
          </div>
        )}
        <label>Price per seat ({currency}) *<input required min={currency === "USD" ? "0.01" : "1"} step="0.01" type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} className="mt-1 w-full px-3 py-3 rounded-xl border"/></label>
        <label>Maximum seats *<input required min="1" type="number" value={form.maxSeats} onChange={e=>setForm({...form,maxSeats:e.target.value})} className="mt-1 w-full px-3 py-3 rounded-xl border"/></label>
        <label>Tour category<input value={form.tourCategory} onChange={e=>setForm({...form,tourCategory:e.target.value})} className="mt-1 w-full px-3 py-3 rounded-xl border"/></label>
        <label className="md:col-span-2">Itinerary<textarea rows={4} value={form.itinerary} onChange={e=>setForm({...form,itinerary:e.target.value})} className="mt-1 w-full px-3 py-3 rounded-xl border resize-none"/></label>
      </Card>
      <Card className="p-5 space-y-3"><h2 className="font-semibold flex gap-2"><MapPin className="h-5 w-5 text-primary"/>Pickup Stations</h2>
        {!stations.length?<p className="text-sm text-muted-foreground">No active stations. <Link href="/dashboard/pickup-stations" className="text-primary">Create one first.</Link></p>:stations.map(station=>{
          const value = stationConfig[station.id] ?? {
            selected: false,
            pickupTime: "",
            extraPrice: currency === "ETB" ? String(station.extra_price ?? 0) : "",
          };
          return (
            <div key={station.id} className={`border rounded-xl p-4 ${value.selected ? "border-primary bg-primary/5" : ""}`}>
              <label className="flex gap-3">
                <input type="checkbox" checked={value.selected} onChange={e=>setStationConfig({...stationConfig,[station.id]:{...value,selected:e.target.checked}})}/>
                <span><b>{station.name}</b><small className="block text-muted-foreground">{[station.address,station.city].filter(Boolean).join(", ")}</small></span>
              </label>
              {value.selected ? (
                <div className="grid gap-3 mt-3 sm:grid-cols-2 sm:pl-6">
                  <label className="text-sm">Pickup time (EAT)
                    <input type="time" required value={value.pickupTime} onChange={e=>setStationConfig({...stationConfig,[station.id]:{...value,pickupTime:e.target.value}})} className="mt-1 w-full px-3 py-2 rounded-lg border"/>
                  </label>
                  <label className="text-sm">Pickup surcharge ({currency})
                    <input type="number" min="0" step="0.01" value={value.extraPrice} onChange={e=>setStationConfig({...stationConfig,[station.id]:{...value,extraPrice:e.target.value}})} className="mt-1 w-full px-3 py-2 rounded-lg border"/>
                  </label>
                </div>
              ) : null}
            </div>
          );
        })}
      </Card>
      <div className="flex justify-end gap-3"><Link href="/dashboard/trips"><Button type="button" variant="outline">Cancel</Button></Link><Button type="submit" isLoading={saving} leftIcon={<CheckCircle className="h-4 w-4"/>}>Save Trip</Button></div>
    </form>
  </div>;
}
