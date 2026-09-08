"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, Users, CreditCard, CalendarCheck, Download, RefreshCw } from "lucide-react";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle, Button, StatCard, formatCurrency } from "@tankua/ui";
import { getProviderBookings, getProviderTrips, type BookingDetails, type TripDetails } from "@/lib/queries";

const rangeDays: Record<string, number> = { "7d": 7, "30d": 30, "6m": 183, "1y": 365 };

export default function ReportsPage() {
  const router = useRouter();
  const [providerId,setProviderId]=useState<string|null>(null);
  const [timeRange,setTimeRange]=useState("6m");
  const [bookings,setBookings]=useState<BookingDetails[]>([]);
  const [trips,setTrips]=useState<TripDetails[]>([]);
  const [loading,setLoading]=useState(true);

  const load=async(id:string)=>{setLoading(true);try{const [bookingResult,tripResult]=await Promise.all([getProviderBookings(id,{limit:1000}),getProviderTrips(id,{limit:1000})]);setBookings(bookingResult.bookings);setTrips(tripResult.trips);}finally{setLoading(false);}};
  useEffect(()=>{try{const stored=JSON.parse(localStorage.getItem("provider_user")||"{}");const id=stored.provider_id||stored.provider?.id;if(!id)return router.replace("/login");setProviderId(id);load(id);}catch{router.replace("/login");}},[router]);

  const report=useMemo(()=>{
    const cutoff=Date.now()-rangeDays[timeRange]*86400000;
    const selected=bookings.filter(item=>new Date(item.created_at).getTime()>=cutoff);
    const paid=selected.filter(item=>item.payment_status==="paid");
    const revenue=paid.reduce((sum,item)=>sum+Number(item.total_price||0),0);
    const relevantTrips=trips.filter(item=>new Date(item.departure_date).getTime()>=cutoff);
    const seats=relevantTrips.reduce((sum,item)=>sum+item.max_seats,0);
    const bookedSeats=relevantTrips.reduce((sum,item)=>sum+Math.max(0,item.max_seats-item.available_seats),0);
    const byDestination=new Map<string,{bookings:number;revenue:number}>();paid.forEach(item=>{const name=item.trip?.destination?.name||item.destination_name||"Unknown";const current=byDestination.get(name)||{bookings:0,revenue:0};byDestination.set(name,{bookings:current.bookings+1,revenue:current.revenue+Number(item.total_price||0)});});
    const months=new Map<string,{label:string;revenue:number}>();for(let i=5;i>=0;i--){const date=new Date();date.setDate(1);date.setMonth(date.getMonth()-i);months.set(`${date.getFullYear()}-${date.getMonth()}`,{label:date.toLocaleDateString(undefined,{month:"short"}),revenue:0});}paid.forEach(item=>{const date=new Date(item.created_at);const key=`${date.getFullYear()}-${date.getMonth()}`;const month=months.get(key);if(month)month.revenue+=Number(item.total_price||0);});
    return{selected,paid,revenue,relevantTrips,occupancy:seats?Math.round(bookedSeats/seats*100):0,destinations:Array.from(byDestination.entries()).map(([destination,data])=>({destination,...data})).sort((a,b)=>b.revenue-a.revenue),months:Array.from(months.values())};
  },[bookings,trips,timeRange]);

  const exportReport=()=>{const rows=[["Destination","Paid bookings","Revenue (ETB)"],...report.destinations.map(item=>[item.destination,item.bookings,item.revenue])];const csv=rows.map(row=>row.map(value=>`"${String(value).replaceAll('"','""')}"`).join(",")).join("\n");const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download=`tankua-report-${timeRange}.csv`;a.click();URL.revokeObjectURL(url);};
  const maxRevenue=Math.max(1,...report.months.map(item=>item.revenue));

  return <div className="min-h-screen"><Header title="Reports" subtitle="Live performance from your bookings and trips" actions={<div className="flex gap-2"><select value={timeRange} onChange={event=>setTimeRange(event.target.value)} className="h-9 rounded-lg border bg-background px-3 text-sm"><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="6m">Last 6 months</option><option value="1y">Last year</option></select><Button variant="outline" size="sm" onClick={exportReport} disabled={!report.destinations.length} leftIcon={<Download className="h-4 w-4"/>}>Export</Button><Button variant="ghost" size="sm" isLoading={loading} onClick={()=>providerId&&load(providerId)}><RefreshCw className="h-4 w-4"/></Button></div>}/><div className="portal-content">
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"><StatCard title="Paid revenue" value={formatCurrency(report.revenue)} icon={<CreditCard className="h-6 w-6"/>} variant="primary"/><StatCard title="Paid bookings" value={String(report.paid.length)} icon={<CalendarCheck className="h-6 w-6"/>}/><StatCard title="Scheduled trips" value={String(report.relevantTrips.length)} icon={<TrendingUp className="h-6 w-6"/>}/><StatCard title="Average occupancy" value={`${report.occupancy}%`} icon={<Users className="h-6 w-6"/>}/></div>
    <Card><CardHeader><CardTitle>Revenue trend</CardTitle></CardHeader><CardContent><div className="flex h-64 items-end justify-between gap-2">{report.months.map(item=><div key={item.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><span className="text-[10px] text-muted-foreground">{item.revenue?formatCurrency(item.revenue):""}</span><div className="w-full rounded-t-lg bg-primary/80" style={{height:`${Math.max(item.revenue?8:2,item.revenue/maxRevenue*190)}px`}}/><span className="text-xs text-muted-foreground">{item.label}</span></div>)}</div></CardContent></Card>
    <Card><CardHeader><CardTitle>Performance by destination</CardTitle></CardHeader><CardContent className="p-0">{!report.destinations.length?<p className="p-10 text-center text-muted-foreground">No paid bookings in this period.</p>:<div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b bg-muted/50"><th className="px-6 py-4 text-left text-xs uppercase text-muted-foreground">Destination</th><th className="px-6 py-4 text-left text-xs uppercase text-muted-foreground">Bookings</th><th className="px-6 py-4 text-left text-xs uppercase text-muted-foreground">Revenue</th></tr></thead><tbody>{report.destinations.map(item=><tr key={item.destination} className="border-b last:border-0"><td className="px-6 py-4 font-medium">{item.destination}</td><td className="px-6 py-4">{item.bookings}</td><td className="px-6 py-4 font-semibold text-primary">{formatCurrency(item.revenue)}</td></tr>)}</tbody></table></div>}</CardContent></Card>
  </div></div>;
}
