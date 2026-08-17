"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  FileText,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Clock,
  Search,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Avatar, Input, ConfirmDialog } from "@tankua/ui";
import { getProviderApplications, updateProviderStatus, getProviders, type SupportTicket, type Provider } from "@/lib/queries";
import { supabase } from "@/lib/supabase";

export default function ProviderApplicationsPage() {
  const [applications, setApplications] = useState<SupportTicket[]>([]);
  const [inactiveProviders, setInactiveProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<SupportTicket | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"tickets" | "providers">("tickets");

  useEffect(() => {
    loadApplications();
    loadInactiveProviders();
  }, []);

  const loadApplications = async () => {
    try {
      const result = await getProviderApplications();
      console.log("Applications loaded:", result); // Debug log
      setApplications(result.applications);
    } catch (error) {
      console.error("Error loading applications:", error);
    }
  };

  const loadInactiveProviders = async () => {
    setLoading(true);
    try {
      // Also load inactive providers directly (these are pending applications)
      const result = await getProviders({
        status: "inactive",
        limit: 100,
      });
      setInactiveProviders(result.providers);
      console.log("Inactive providers loaded:", result);
    } catch (error) {
      console.error("Error loading inactive providers:", error);
    } finally {
      setLoading(false);
    }
  };

  const [approveConfirmId, setApproveConfirmId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<{ providerId: string; ticketId: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const handleApprove = (providerId: string) => {
    setApproveConfirmId(providerId);
  };

  const executeApprove = async () => {
    if (!approveConfirmId) return;
    try {
      const success = await updateProviderStatus(approveConfirmId, "active");
      if (success) {
        await supabase
          .from("support_tickets")
          .update({ status: "resolved", resolution_notes: "Provider approved" })
          .eq("provider_id", approveConfirmId)
          .eq("status", "open");

        loadApplications();
        setSelectedApp(null);
      }
    } finally {
      setApproveConfirmId(null);
    }
  };

  const handleReject = (providerId: string, ticketId: string) => {
    setRejectTarget({ providerId, ticketId });
    setRejectReason("");
  };

  const executeReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    const { providerId, ticketId } = rejectTarget;

    try {
      await updateProviderStatus(providerId, "suspended");
      await supabase
        .from("support_tickets")
        .update({
          status: "closed",
          resolution_notes: `Rejected: ${rejectReason.trim()}`,
        })
        .eq("id", ticketId);

      loadApplications();
      setSelectedApp(null);
    } finally {
      setRejectTarget(null);
      setRejectReason("");
    }
  };

  const parseApplicationData = (description: string) => {
    const data: Record<string, string> = {};
    const lines = description.split("\n");
    for (const line of lines) {
      const [key, ...valueParts] = line.split(":");
      if (key && valueParts.length > 0) {
        data[key.trim()] = valueParts.join(":").trim();
      }
    }
    return data;
  };

  const getDocumentUrl = (url: string | null) => {
    if (!url) return null;
    // Extract file path from URL if it's a full URL
    const match = url.match(/provider-docs\/(.+)/);
    if (match) {
      return supabase.storage.from("provider-docs").getPublicUrl(match[1]).data.publicUrl;
    }
    return url;
  };

  const filteredApplications = applications.filter((app) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      app.subject.toLowerCase().includes(searchLower) ||
      app.provider?.name?.toLowerCase().includes(searchLower) ||
      app.provider?.email?.toLowerCase().includes(searchLower)
    );
  });

  const filteredProviders = inactiveProviders.filter((provider) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      provider.name?.toLowerCase().includes(searchLower) ||
      provider.email?.toLowerCase().includes(searchLower) ||
      provider.phone?.toLowerCase().includes(searchLower)
    );
  });

  const pendingCount = viewMode === "tickets" ? applications.length : inactiveProviders.length;

  return (
    <div className="min-h-screen">
      <Header
        title="Provider Applications"
        subtitle={`${pendingCount} pending application${pendingCount !== 1 ? "s" : ""}`}
        actions={
          <>
            <div className="flex items-center gap-2 border border-border rounded-lg p-1">
              <button
                onClick={() => setViewMode("tickets")}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  viewMode === "tickets"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                From Tickets
              </button>
              <button
                onClick={() => setViewMode("providers")}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  viewMode === "providers"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Inactive Providers
              </button>
            </div>
            <Button variant="outline" size="sm" onClick={() => {
              loadApplications();
              loadInactiveProviders();
            }}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </>
        }
      />

      <div className="p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Applications List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Pending Applications</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search applications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : viewMode === "tickets" && filteredApplications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending applications from tickets</p>
                  <p className="text-xs mt-2">Try switching to "Inactive Providers" view</p>
                </div>
              ) : viewMode === "providers" && filteredProviders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No inactive providers</p>
                </div>
              ) : viewMode === "tickets" ? (
                <div className="space-y-3">
                  {filteredApplications.map((app) => {
                    const appData = parseApplicationData(app.description);
                    return (
                      <div
                        key={app.id}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedApp?.id === app.id
                            ? "border-primary bg-primary/5"
                            : "border-transparent bg-muted/30 hover:border-border"
                        }`}
                        onClick={() => setSelectedApp(app)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <Avatar name={app.provider?.name || "Provider"} size="sm" />
                            <div>
                              <p className="font-medium text-sm">{app.provider?.name || "Unknown Provider"}</p>
                              <p className="text-xs text-muted-foreground">{app.ticket_number}</p>
                            </div>
                          </div>
                          <Badge variant="destructive" dot>
                            Pending
                          </Badge>
                        </div>
                        <div className="mt-3 space-y-1">
                          {appData.Company && (
                            <p className="text-sm">
                              <span className="text-muted-foreground">Company:</span> {appData.Company}
                            </p>
                          )}
                          {appData.Email && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {appData.Email}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(app.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredProviders.map((provider) => (
                    <div
                      key={provider.id}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedApp?.provider_id === provider.id
                          ? "border-primary bg-primary/5"
                          : "border-transparent bg-muted/30 hover:border-border"
                      }`}
                      onClick={() => {
                        // Find related ticket if exists
                        const relatedTicket = applications.find(t => t.provider_id === provider.id);
                        if (relatedTicket) {
                          setSelectedApp(relatedTicket);
                        } else {
                          // Create a mock ticket for display
                          setSelectedApp({
                            id: provider.id,
                            ticket_number: "N/A",
                            subject: `Provider: ${provider.name}`,
                            description: `Name: ${provider.name}\nEmail: ${provider.email || "N/A"}\nPhone: ${provider.phone || "N/A"}\nDescription: ${provider.description || "N/A"}`,
                            category: "general",
                            priority: "high",
                            status: "open",
                            provider_id: provider.id,
                            provider: provider,
                            user_id: null,
                            booking_id: null,
                            assigned_to: null,
                            created_at: provider.created_at,
                            updated_at: provider.created_at,
                          });
                        }
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Avatar name={provider.name} size="sm" />
                          <div>
                            <p className="font-medium text-sm">{provider.name}</p>
                            <p className="text-xs text-muted-foreground">Inactive Provider</p>
                          </div>
                        </div>
                        <Badge variant="secondary" dot>
                          Inactive
                        </Badge>
                      </div>
                      <div className="mt-3 space-y-1">
                        {provider.email && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {provider.email}
                          </p>
                        )}
                        {provider.phone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {provider.phone}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(provider.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Application Details */}
          <Card>
            <CardHeader>
              <CardTitle>Application Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedApp ? (
                <div className="space-y-4">
                  {(() => {
                    const appData = parseApplicationData(selectedApp.description);
                    const tradeLicenseUrl = appData["Trade License"];
                    const tourLicenseUrl = appData["Tour License"];

                    return (
                      <>
                        <div className="p-4 bg-muted/30 rounded-xl">
                          <div className="flex items-center gap-3 mb-4">
                            <Avatar name={selectedApp.provider?.name || "Provider"} size="md" />
                            <div>
                              <p className="font-semibold">{selectedApp.provider?.name || "Unknown Provider"}</p>
                              <p className="text-xs text-muted-foreground">{selectedApp.ticket_number}</p>
                            </div>
                          </div>

                          <div className="space-y-2 text-sm">
                            {appData.Company && (
                              <div>
                                <span className="text-muted-foreground">Company:</span> {appData.Company}
                              </div>
                            )}
                            {appData["Business Type"] && (
                              <div>
                                <span className="text-muted-foreground">Business Type:</span> {appData["Business Type"]}
                              </div>
                            )}
                            {appData.City && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">City:</span> {appData.City}
                              </div>
                            )}
                            {appData.Address && (
                              <div>
                                <span className="text-muted-foreground">Address:</span> {appData.Address}
                              </div>
                            )}
                            {appData.Owner && (
                              <div>
                                <span className="text-muted-foreground">Owner:</span> {appData.Owner}
                              </div>
                            )}
                            {appData.Phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                <span>{appData.Phone}</span>
                              </div>
                            )}
                            {appData.Email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                <span>{appData.Email}</span>
                              </div>
                            )}
                            {appData.Description && (
                              <div className="mt-3 pt-3 border-t border-border">
                                <span className="text-muted-foreground">Description:</span>
                                <p className="mt-1">{appData.Description}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Documents */}
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Documents</p>
                          {tradeLicenseUrl && tradeLicenseUrl !== "N/A" && (
                            <div className="p-3 bg-muted/30 rounded-lg flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">Trade License</span>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const url = getDocumentUrl(tradeLicenseUrl);
                                    if (url) window.open(url, "_blank");
                                  }}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const url = getDocumentUrl(tradeLicenseUrl);
                                    if (url) {
                                      const link = document.createElement("a");
                                      link.href = url;
                                      link.download = "trade-license.pdf";
                                      link.click();
                                    }
                                  }}
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                          {tourLicenseUrl && tourLicenseUrl !== "N/A" && (
                            <div className="p-3 bg-muted/30 rounded-lg flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">Tour License</span>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const url = getDocumentUrl(tourLicenseUrl);
                                    if (url) window.open(url, "_blank");
                                  }}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const url = getDocumentUrl(tourLicenseUrl);
                                    if (url) {
                                      const link = document.createElement("a");
                                      link.href = url;
                                      link.download = "tour-license.pdf";
                                      link.click();
                                    }
                                  }}
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        {selectedApp.provider_id && (
                          <div className="flex gap-2 pt-4 border-t border-border">
                            <Button
                              className="flex-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                              variant="outline"
                              onClick={() => handleApprove(selectedApp.provider_id!)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => handleReject(selectedApp.provider_id!, selectedApp.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select an application to view details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!approveConfirmId}
        onOpenChange={(open) => !open && setApproveConfirmId(null)}
        title="Approve Provider Application"
        description="Are you sure you want to approve this provider application? They will gain active status immediately."
        confirmText="Approve Provider"
        cancelText="Cancel"
        variant="info"
        onConfirm={executeApprove}
      />

      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Reject Provider Application</h3>
            <p className="text-sm text-slate-300">Please provide a reason for rejecting this provider application:</p>
            <textarea
              className="w-full h-24 p-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-red-500"
              placeholder="e.g. Incomplete business documentation..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setRejectTarget(null)}>
                Cancel
              </Button>

              <Button
                className="bg-red-600 hover:bg-red-500 text-white"
                disabled={!rejectReason.trim()}
                onClick={executeReject}
              >
                Reject Application
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

