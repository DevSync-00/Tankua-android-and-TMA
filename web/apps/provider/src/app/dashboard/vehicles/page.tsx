"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Car,
  Plus,
  Search,
  Users,
  Calendar,
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Header } from "@/components/header";
import { Card, CardContent, Button, Badge, Avatar } from "@tankua/ui";

const vehicles = [
  { id: "1", name: "Toyota Coaster", plate: "AA-12345", capacity: 25, year: 2022, status: "active", nextService: "Feb 15, 2024", driver: "Bekele T." },
  { id: "2", name: "Isuzu NQR", plate: "AA-23456", capacity: 45, year: 2021, status: "active", nextService: "Mar 1, 2024", driver: "Dawit H." },
  { id: "3", name: "Toyota Hiace", plate: "AA-34567", capacity: 15, year: 2023, status: "maintenance", nextService: "Jan 20, 2024", driver: null },
  { id: "4", name: "Yutong Bus", plate: "AA-45678", capacity: 50, year: 2020, status: "active", nextService: "Feb 28, 2024", driver: "Solomon A." },
  { id: "5", name: "Toyota Coaster", plate: "AA-56789", capacity: 25, year: 2022, status: "active", nextService: "Mar 15, 2024", driver: "Tesfaye M." },
];

export default function VehiclesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredVehicles = vehicles.filter((vehicle) =>
    vehicle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.plate.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="success" dot>Active</Badge>;
      case "maintenance":
        return <Badge variant="warning" dot>Maintenance</Badge>;
      case "inactive":
        return <Badge variant="secondary" dot>Inactive</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const totalCapacity = vehicles.filter(v => v.status === "active").reduce((sum, v) => sum + v.capacity, 0);

  return (
    <div className="min-h-screen">
      <Header
        title="Vehicles"
        subtitle={`${vehicles.length} vehicles in your fleet`}
        actions={
          <Link href="/dashboard/vehicles/new">
            <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
              Add Vehicle
            </Button>
          </Link>
        }
      />

      <div className="portal-content">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search vehicles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-11 pr-4 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Total Vehicles</p>
            <p className="text-2xl font-bold mt-1">{vehicles.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold mt-1 text-emerald-600">
              {vehicles.filter(v => v.status === "active").length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">In Maintenance</p>
            <p className="text-2xl font-bold mt-1 text-amber-600">
              {vehicles.filter(v => v.status === "maintenance").length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Total Capacity</p>
            <p className="text-2xl font-bold mt-1 text-primary">{totalCapacity} seats</p>
          </Card>
        </div>

        {/* Vehicles Table */}
        <Card>
          <CardContent className="p-0">
            {/* Mobile Card View */}
            <div className="lg:hidden divide-y divide-border">
              {filteredVehicles.map((vehicle) => (
                <div key={vehicle.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Car className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{vehicle.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{vehicle.plate} • {vehicle.year}</p>
                      </div>
                    </div>
                    {getStatusBadge(vehicle.status)}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Capacity</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-medium">{vehicle.capacity} seats</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Driver</p>
                      {vehicle.driver ? (
                        <div className="flex items-center gap-2 mt-1">
                          <Avatar name={vehicle.driver} size="sm" />
                          <span className="text-sm truncate">{vehicle.driver}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground mt-1 block">Unassigned</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Next service: {vehicle.nextService}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vehicle</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Capacity</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assigned Driver</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Next Service</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-left py-4 px-6"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Car className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{vehicle.name}</p>
                            <p className="text-xs text-muted-foreground">{vehicle.plate} • {vehicle.year}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{vehicle.capacity} seats</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {vehicle.driver ? (
                          <div className="flex items-center gap-2">
                            <Avatar name={vehicle.driver} size="sm" />
                            <span className="text-sm">{vehicle.driver}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Unassigned</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{vehicle.nextService}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(vehicle.status)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

