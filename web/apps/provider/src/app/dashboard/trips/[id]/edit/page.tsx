"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, MapPin } from "lucide-react";
import { Header } from "@/components/header";
import { Button, Card } from "@tankua/ui";
import { supabase } from "@/lib/supabase";
import { getProviderTrip, replaceTripPickupStations, updateTrip } from "@/lib/queries";

type Station = { id: string; name: string; city: string | null; address: string | null; extra_price: number };
type StationValue = { selected: boolean; pickupTime: string; extraPrice: string };

export default function EditTripPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [providerId,setProviderId]=useState("");
  const [destinations,setDestinations]=useState<Array<{id:string;name:string}>>([]);
  const [stations,setStations]=useState<Station[]>([]);
  const [stationConfig,setStationConfig]=useState<Record<string,StationValue>>({});
  const [form,setForm]=useState({destinationId:"",tripType:"round_trip",departureDate:"",departureTime:"",returnDate:"",price:"",maxSeats:"",tourCategory:"",itinerary:"",status:"upcoming"});
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");

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
      const departure=new Date(trip.departure_date||trip.date);
      setForm({
        destinationId:trip.destination_id||"", tripType:trip.trip_type||"round_trip",
        departureDate:departure.toISOString().slice(0,10), departureTime:departure.toTimeString().slice(0,5),
        returnDate:trip.return_date?new Date(trip.return_date).toISOString().slice(0,10):"",
        price:String(trip.price||""), maxSeats:String(trip.max_seats||""), tourCategory:trip.tour_category||"",
        itinerary:trip.itinerary||"", status:trip.status||"upcoming",
      });
      const links:Record<string,StationValue>={};
      (tripResult.stations as any[]).forEach(link=>{links[link.station_id]={selected:true,pickupTime:link.pickup_time||"",extraPrice:String(link.extra_price||0)};});
      setStationConfig(links);
    }).finally(()=>setLoading(false));
  },[id,router]);

  async function submit(event:FormEvent){
    event.preventDefault(); setError("");
    const selected=stations.filter(station=>stationConfig[station.id]?.selected);
    if(!selected.length){setError("Select at least one pickup station.");return;}
    if(selected.some(station=>!stationConfig[station.id]?.pickupTime)){setError("Add a pickup time for every selected station.");return;}
    const departure=new Date(`${form.departureDate}T${form.departureTime}:00`);
    if(Number.isNaN(departure.getTime())){setError("Enter a valid departure date and time.");return;}
    setSaving(true);
    const tripResult=await updateTrip(id,{
      destination_id:form.destinationId,trip_type:form.tripType,departure_date:departure.toISOString(),
      return_date:form.tripType==="round_trip"&&form.returnDate?new Date(`${form.returnDate}T${form.departureTime}:00`).toISOString():null,
      price:Number(form.price),max_seats:Number(form.maxSeats),tour_category:form.tourCategory||undefined,
      itinerary:form.itinerary.trim()||undefined,status:form.status,
    });
    if(!tripResult.success){setError(tripResult.error||"Could not update trip.");setSaving(false);return;}
    const stationResult=await replaceTripPickupStations(id,selected.map(station=>({
      station_id:station.id,pickup_time:stationConfig[station.id].pickupTime,
      extra_price:Number(stationConfig[station.id].extraPrice||station.extra_price||0),
    })));
    if(!stationResult.success){setError(stationResult.error||"Trip updated, but pickup stations could not be saved.");setSaving(false);return;}
    router.push("/dashboard/trips"); router.refresh();
  }

  if(loading)return <div><Header title="Edit Trip" subtitle="Loading trip…"/><p className="p-6">Loading…</p></div>;
  return <div className="min-h-screen">
    <Header title="Edit Trip" subtitle="Update schedule, capacity, pricing, and pickup stations" actions={<Link href="/dashboard/trips"><Button variant="outline" size="sm" leftIcon={<ArrowLeft className="h-4 w-4"/>}>Back to Trips</Button></Link>}/>
    <form onSubmit={submit} className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {error&&<div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>}
      <Card className="p-5 grid md:grid-cols-2 gap-4">
        <label>Destination *<select required value={form.destinationId} onChange={e=>setForm({...form,destinationId:e.target.value})} className="mt-1 w-full px-3 py-3 rounded-xl border bg-background">{destinations.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>Trip type<select value={form.tripType} onChange={e=>setForm({...form,tripType:e.target.value})} className="mt-1 w-full px-3 py-3 rounded-xl border bg-background"><option value="round_trip">Round trip</option><option value="one_way">One way</option></select></label>
        <label>Departure date *<input required type="date" value={form.departureDate} onChange={e=>setForm({...form,departureDate:e.target.value})} className="mt-1 w-full px-3 py-3 rounded-xl border"/></label>
        <label>Departure time *<input required type="time" value={form.departureTime} onChange={e=>setForm({...form,departureTime:e.target.value})} className="mt-1 w-full px-3 py-3 rounded-xl border"/></label>
        {form.tripType==="round_trip"&&<label>Return date *<input required type="date" value={form.returnDate} onChange={e=>setForm({...form,returnDate:e.target.value})} className="mt-1 w-full px-3 py-3 rounded-xl border"/></label>}
        <label>Status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className="mt-1 w-full px-3 py-3 rounded-xl border bg-background"><option value="upcoming">Upcoming</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></label>
        <label>Price per seat (ETB) *<input required min="1" type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} className="mt-1 w-full px-3 py-3 rounded-xl border"/></label>
        <label>Maximum seats *<input required min="1" type="number" value={form.maxSeats} onChange={e=>setForm({...form,maxSeats:e.target.value})} className="mt-1 w-full px-3 py-3 rounded-xl border"/></label>
        <label>Tour category<input value={form.tourCategory} onChange={e=>setForm({...form,tourCategory:e.target.value})} className="mt-1 w-full px-3 py-3 rounded-xl border"/></label>
        <label className="md:col-span-2">Itinerary<textarea rows={4} value={form.itinerary} onChange={e=>setForm({...form,itinerary:e.target.value})} className="mt-1 w-full px-3 py-3 rounded-xl border resize-none"/></label>
      </Card>
      <Card className="p-5 space-y-3"><h2 className="font-semibold flex gap-2"><MapPin className="h-5 w-5 text-primary"/>Pickup Stations</h2>
        {!stations.length?<p className="text-sm text-muted-foreground">No active stations. <Link href="/dashboard/pickup-stations" className="text-primary">Create one first.</Link></p>:stations.map(station=>{
          const value=stationConfig[station.id]||{selected:false,pickupTime:"",extraPrice:String(station.extra_price||0)};
          return <div key={station.id} className={`border rounded-xl p-4 ${value.selected?"border-primary bg-primary/5":""}`}><label className="flex gap-3"><input type="checkbox" checked={value.selected} onChange={e=>setStationConfig({...stationConfig,[station.id]:{...value,selected:e.target.checked}})}/><span><b>{station.name}</b><small className="block text-muted-foreground">{[station.address,station.city].filter(Boolean).join(", ")}</small></span></label>{value.selected&&<div className="grid grid-cols-2 gap-3 mt-3 pl-6"><input type="time" value={value.pickupTime} onChange={e=>setStationConfig({...stationConfig,[station.id]:{...value,pickupTime:e.target.value}})} className="px-3 py-2 rounded-lg border"/><input type="number" min="0" value={value.extraPrice} onChange={e=>setStationConfig({...stationConfig,[station.id]:{...value,extraPrice:e.target.value}})} className="px-3 py-2 rounded-lg border" placeholder="Extra price"/></div>}</div>;
        })}
      </Card>
      <div className="flex justify-end gap-3"><Link href="/dashboard/trips"><Button type="button" variant="outline">Cancel</Button></Link><Button type="submit" isLoading={saving} leftIcon={<CheckCircle className="h-4 w-4"/>}>Save Trip</Button></div>
    </form>
  </div>;
}
