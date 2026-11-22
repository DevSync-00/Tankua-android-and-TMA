"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  Search,
  Filter,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  RefreshCw,
  CheckCircle,
  XCircle,
  Pause,
  Plus,
  Edit,
  X,
  Save,
  AlertCircle,
  CheckCircle as CheckCircleIcon,
} from "lucide-react";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Avatar, Input } from "@tankua/ui";
import { getProviders, updateProviderStatus, updateProvider, createProvider, type Provider } from "@/lib/queries";

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const limit = 10;
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    phone: "",
    email: "",
    logo_url: "",
    status: "inactive" as "active" | "inactive" | "suspended",
  });

  useEffect(() => {
    loadProviders();
  }, [page, search, statusFilter]);

  const loadProviders = async () => {
    setLoading(true);
    try {
      const result = await getProviders({
        limit,
        offset: (page - 1) * limit,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setProviders(result.providers);
      setTotal(result.total);
    } catch (error) {
      console.error("Error loading providers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: 'active' | 'inactive' | 'suspended') => {
    const success = await updateProviderStatus(id, newStatus);
    if (success) {
      loadProviders();
    }
  };

  const handleAdd = () => {
    setFormData({
      name: "",
      description: "",
      phone: "",
      email: "",
      logo_url: "",
      status: "inactive",
    });
    setSelectedProvider(null);
    setError("");
    setSuccess("");
    setShowAddModal(true);
  };

  const handleEdit = (provider: Provider) => {
    setSelectedProvider(provider);
    setFormData({
      name: provider.name,
      description: provider.description || "",
      phone: provider.phone || "",
      email: provider.email || "",
      logo_url: provider.logo_url || "",
      status: provider.status,
    });
    setError("");
    setSuccess("");
    setShowEditModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (selectedProvider) {
        // Update existing
        const success = await updateProvider(selectedProvider.id, formData);
        if (success) {
          setSuccess("Provider updated successfully!");
          setTimeout(() => {
            setShowEditModal(false);
            loadProviders();
          }, 1500);
        } else {
          setError("Failed to update provider");
        }
      } else {
        // Create new
        const result = await createProvider(formData);
        if (result.success) {
          setSuccess("Provider created successfully!");
          setTimeout(() => {
            setShowAddModal(false);
            loadProviders();
          }, 1500);
        } else {
          setError(result.error || "Failed to create provider");
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="success" dot>Active</Badge>;
      case "inactive":
        return <Badge variant="secondary" dot>Inactive</Badge>;
      case "suspended":
        return <Badge variant="destructive" dot>Suspended</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Providers"
        subtitle={`Manage ${total.toLocaleString()} travel providers`}
        actions={
          <>
            <Button size="sm" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Provider
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.location.href = "/dashboard/provider-applications"}>
              View Applications
            </Button>
            <Button variant="outline" size="sm" onClick={loadProviders}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </>
        }
      />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search providers..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-border rounded-lg bg-background text-sm"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {/* Providers Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : providers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No providers found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((provider) => (
              <Card key={provider.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={provider.name} size="lg" />
                      <h3 className="font-semibold">{provider.name}</h3>
                    </div>
                    {getStatusBadge(provider.status)}
                  </div>

                  {provider.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {provider.description}
                    </p>
                  )}

                  <div className="space-y-2 mb-4">
                    {provider.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{provider.phone}</span>
                      </div>
                    )}
                    {provider.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{provider.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(provider)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    {provider.status !== "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                        onClick={() => handleStatusUpdate(provider.id, "active")}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Activate
                      </Button>
                    )}
                    {provider.status === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusUpdate(provider.id, "inactive")}
                      >
                        <Pause className="h-4 w-4 mr-1" />
                        Deactivate
                      </Button>
                    )}
                    {provider.status !== "suspended" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => handleStatusUpdate(provider.id, "suspended")}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground text-center sm:text-left">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} providers
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{selectedProvider ? "Edit Provider" : "Add New Provider"}</CardTitle>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setError("");
                    setSuccess("");
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
                    <CheckCircleIcon className="h-4 w-4 shrink-0" />
                    <p>{success}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Company Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Provider company name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Company description"
                    rows={3}
                    className="w-full px-4 py-2 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-background resize-none"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone</label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Email address"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Logo URL</label>
                  <Input
                    value={formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-2 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-background"
                  >
                    <option value="inactive">Inactive</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setError("");
                      setSuccess("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" isLoading={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {selectedProvider ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}


