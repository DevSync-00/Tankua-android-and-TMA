"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Car, Plus, Search, Users, Calendar, Trash2, RefreshCw } from "lucide-react";
import { Header } from "@/components/header";
import { Card, CardContent, Button, Badge, Avatar, ConfirmDialog, InlineBanner } from "@tankua/ui";
import { deleteVehicle, getVehicles, updateVehicleStatus, type Vehicle } from "@/lib/queries";

export default function VehiclesPage() {
  const router = useRouter();
  const [providerId, setProviderId] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ message: string; variant: "success" | "error" } | null>(null);

  const loadVehicles = async (id: string) => {
    setLoading(true);
    try { setVehicles(await getVehicles(id)); }
    catch (error) { setBanner({ message: error instanceof Error ? error.message : "Could not load vehicles.", variant: "error" }); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("provider_user") || "{}");
      const id = stored.provider_id || stored.provider?.id;
      if (!id) return router.replace("/login");
      setProviderId(id);
      loadVehicles(id);
    } catch { router.replace("/login"); }
  }, [router]);

  const filteredVehicles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return vehicles.filter((vehicle) => `${vehicle.make || ""} ${vehicle.model || ""} ${vehicle.plate_number}`.toLowerCase().includes(query));
  }, [vehicles, searchQuery]);

  const changeStatus = async (id: string, status: Vehicle["status"]) => {
    const result = await updateVehicleStatus(id, status);
    if (!result.success) return setBanner({ message: result.error || "Could not update vehicle.", variant: "error" });
    setVehicles((current) => current.map((vehicle) => vehicle.id === id ? { ...vehicle, status } : vehicle));
    setBanner({ message: "Vehicle status updated.", variant: "success" });
  };

  const removeVehicle = async () => {
    if (!confirmDeleteId) return;
    const result = await deleteVehicle(confirmDeleteId);
    if (!result.success) setBanner({ message: result.error || "Could not delete vehicle.", variant: "error" });
    else {
      setVehicles((current) => current.filter((vehicle) => vehicle.id !== confirmDeleteId));
      setBanner({ message: "Vehicle deleted.", variant: "success" });
    }
    setConfirmDeleteId(null);
  };

  const badge = (status: Vehicle["status"]) => <Badge variant={status === "active" ? "success" : status === "maintenance" ? "warning" : "secondary"} dot>{status === "active" ? "Active" : status === "maintenance" ? "Maintenance" : "Inactive"}</Badge>;
  const totalCapacity = vehicles.filter((vehicle) => vehicle.status === "active").reduce((sum, vehicle) => sum + vehicle.capacity, 0);

  return <div className="min-h-screen">
    <Header title="Vehicles" subtitle={loading ? "Loading fleet..." : `${vehicles.length} vehicles in your fleet`} actions={<div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => providerId && loadVehicles(providerId)} isLoading={loading} leftIcon={<RefreshCw className="h-4 w-4"/>}>Refresh</Button><Link href="/dashboard/vehicles/new"><Button size="sm" leftIcon={<Plus className="h-4 w-4"/>}>Add Vehicle</Button></Link></div>}/>
    <div className="portal-content">
      {banner && (
        <InlineBanner message={banner.message} variant={banner.variant} onDismiss={() => setBanner(null)}/>
      )}
      <div className="portal-toolbar"><div className="relative w-full max-w-md"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search by model or plate..." className="h-11 w-full rounded-xl border bg-muted/30 pl-11 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"/></div></div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[["Total vehicles",vehicles.length],["Active",vehicles.filter(v=>v.status==="active").length],["Maintenance",vehicles.filter(v=>v.status==="maintenance").length],["Active capacity",`${totalCapacity} seats`]].map(([label,value])=><Card key={label} className="p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></Card>)}</div>
      {!loading && !filteredVehicles.length ? <Card><CardContent className="py-12 text-center"><Car className="mx-auto mb-3 h-10 w-10 text-muted-foreground"/><p className="font-medium">{searchQuery ? "No matching vehicles" : "No vehicles yet"}</p>{!searchQuery && <Link href="/dashboard/vehicles/new"><Button className="mt-4" leftIcon={<Plus className="h-4 w-4"/>}>Add your first vehicle</Button></Link>}</CardContent></Card> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredVehicles.map((vehicle) => {
        const name=[vehicle.make,vehicle.model].filter(Boolean).join(" ") || vehicle.vehicle_type;
        return <Card key={vehicle.id} className="p-5"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10"><Car className="h-5 w-5 text-primary"/></span><div className="min-w-0"><h3 className="truncate font-semibold">{name}</h3><p className="text-sm text-muted-foreground">{vehicle.plate_number} · {vehicle.year || "Year not set"}</p></div></div>{badge(vehicle.status)}</div><div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-muted/40 p-3 text-sm"><span><small className="block text-muted-foreground">Capacity</small><b className="flex items-center gap-1"><Users className="h-3.5 w-3.5"/>{vehicle.capacity} seats</b></span><span><small className="block text-muted-foreground">Driver</small><b>{vehicle.driver ? <span className="flex items-center gap-1"><Avatar name={vehicle.driver.name} size="sm"/>{vehicle.driver.name}</span> : "Unassigned"}</b></span>{vehicle.inspection_expiry && <span className="col-span-2"><small className="block text-muted-foreground">Inspection expiry</small><b className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5"/>{new Date(vehicle.inspection_expiry).toLocaleDateString()}</b></span>}</div><div className="mt-4 flex gap-2 border-t pt-4"><select aria-label={`Status for ${name}`} value={vehicle.status} onChange={(event)=>changeStatus(vehicle.id,event.target.value as Vehicle["status"])} className="h-9 min-w-0 flex-1 rounded-lg border bg-background px-3 text-xs font-semibold"><option value="active">Active</option><option value="maintenance">Maintenance</option><option value="inactive">Inactive</option></select><Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={()=>setConfirmDeleteId(vehicle.id)} title="Delete vehicle"><Trash2 className="h-4 w-4"/></Button></div></Card>;
      })}</div>
    </div>
    <ConfirmDialog isOpen={!!confirmDeleteId} onOpenChange={(open)=>!open&&setConfirmDeleteId(null)} title="Delete Vehicle" description="Remove this vehicle from your fleet? Existing trip assignments may be affected." confirmText="Delete Vehicle" variant="danger" onConfirm={removeVehicle}/>
  </div>;
}
