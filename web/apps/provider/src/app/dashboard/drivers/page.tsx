"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Plus,
  Search,
  Phone,
  Star,
  MoreHorizontal,
  Edit,
  Trash2,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { Header } from "@/components/header";
import { Card, CardContent, Button, Badge, Avatar, ConfirmDialog, InlineBanner } from "@tankua/ui";
import { getDrivers, deleteDriver, updateDriverStatus, type Driver } from "@/lib/queries";

export default function DriversPage() {
  const router = useRouter();
  const [providerId, setProviderId] = useState<string | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingDriverId, setDeletingDriverId] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ message: string; variant: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    loadProviderSession();
  }, []);

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
      loadDrivers(id);
    } catch (err) {
      console.error("Failed to load provider session", err);
      router.replace("/login");
    }
  };

  const loadDrivers = async (id: string) => {
    setLoading(true);
    try {
      const driversData = await getDrivers(id);
      setDrivers(driversData);
    } catch (error) {
      console.error("Error loading drivers:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDrivers = drivers.filter((driver) =>
    driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.license_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = (driverId: string) => {
    setConfirmDeleteId(driverId);
  };

  const executeDelete = async () => {
    if (!confirmDeleteId) return;
    setDeletingDriverId(confirmDeleteId);
    try {
      const result = await deleteDriver(confirmDeleteId);
      if (result.success) {
        if (providerId) {
          loadDrivers(providerId);
        }
        setBanner({ message: "Driver deleted successfully", variant: "success" });
      } else {
        setBanner({ message: result.error || "Failed to delete driver", variant: "error" });
      }
    } catch (err) {
      console.error(err);
      setBanner({ message: "Failed to delete driver. Please try again.", variant: "error" });
    } finally {
      setDeletingDriverId(null);
      setConfirmDeleteId(null);
    }
  };

  const handleStatusChange = async (driverId: string, newStatus: 'available' | 'on_trip' | 'offline') => {
    try {
      const success = await updateDriverStatus(driverId, newStatus);
      if (success) {
        if (providerId) {
          await loadDrivers(providerId);
        }
      } else {
        setBanner({ message: "Failed to update driver status", variant: "error" });
      }
    } catch (err) {
      console.error("Error updating driver status:", err);
      setBanner({ message: "Failed to update driver status. Please try again.", variant: "error" });
    }
  };

  const stats = {
    total: drivers.length,
    available: drivers.filter(d => d.status === 'available').length,
    onTrip: drivers.filter(d => d.status === 'on_trip').length,
    avgRating: drivers.length > 0 
      ? (drivers.reduce((sum, d) => sum + d.rating, 0) / drivers.length).toFixed(1)
      : '0.0',
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge variant="success" dot>Available</Badge>;
      case "on_trip":
        return <Badge variant="warning" dot>On Trip</Badge>;
      case "offline":
        return <Badge variant="secondary" dot>Offline</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Drivers"
        subtitle={loading ? "Loading drivers..." : `${drivers.length} drivers in your team`}
        actions={
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => providerId && loadDrivers(providerId)}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Link href="/dashboard/drivers/new">
              <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
                Add Driver
              </Button>
            </Link>
          </div>
        }
      />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search drivers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-11 pr-4 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Total Drivers</p>
            <p className="text-2xl font-bold mt-1">{stats.total}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Available</p>
            <p className="text-2xl font-bold mt-1 text-emerald-600">
              {stats.available}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">On Trip</p>
            <p className="text-2xl font-bold mt-1 text-amber-600">
              {stats.onTrip}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Avg Rating</p>
            <p className="text-2xl font-bold mt-1 text-primary">
              {stats.avgRating}
            </p>
          </Card>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && filteredDrivers.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "No drivers found matching your search" : "No drivers yet"}
              </p>
              {!searchQuery && (
                <Link href="/dashboard/drivers/new">
                  <Button className="mt-4" leftIcon={<Plus className="h-4 w-4" />}>
                    Add Your First Driver
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        {/* Drivers Grid */}
        {!loading && filteredDrivers.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDrivers.map((driver) => (
              <Card key={driver.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <Avatar name={driver.name} size="lg" />
                    <div>
                      <h3 className="font-semibold">{driver.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        License: {driver.license_number || "N/A"}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(driver.status)}
                </div>

                <div className="space-y-3 mb-4">
                  {driver.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{driver.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <span>{driver.rating.toFixed(1)} rating</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-border">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1" 
                    leftIcon={<Edit className="h-4 w-4" />}
                    onClick={() => router.push(`/dashboard/drivers/${driver.id}/edit`)}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-destructive" 
                    leftIcon={<Trash2 className="h-4 w-4" />}
                    onClick={() => handleDelete(driver.id)}
                    disabled={deletingDriverId === driver.id}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
        title="Delete Driver"
        description="Are you sure you want to delete this driver? Trip assignments will be affected."
        confirmText="Delete Driver"
        cancelText="Cancel"
        variant="danger"
        onConfirm={executeDelete}
      />
    </div>
  );
}

