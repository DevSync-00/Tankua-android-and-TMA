"use client";

import { useState, useEffect } from "react";
import {
  HelpCircle,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Building2,
  MoreHorizontal,
  Send,
  Search,
  RefreshCw,
} from "lucide-react";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Avatar } from "@tankua/ui";
import { getSupportTickets, updateSupportTicket, type SupportTicket } from "@/lib/queries";

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadTickets();
  }, [filter]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const result = await getSupportTickets({
        status: filter !== "all" ? filter : undefined,
        limit: 50,
      });
      setTickets(result.tickets);
    } catch (error) {
      console.error("Error loading support tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High</Badge>;
      case "medium":
        return <Badge variant="warning">Medium</Badge>;
      case "low":
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="destructive" dot>Open</Badge>;
      case "in_progress":
        return <Badge variant="warning" dot>In Progress</Badge>;
      case "resolved":
        return <Badge variant="success" dot>Resolved</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchesFilter = filter === "all" || t.status === filter;
    const matchesSearch = !searchQuery || 
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ticket_number?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const openTickets = tickets.filter(t => t.status === "open").length;
  const inProgressTickets = tickets.filter(t => t.status === "in_progress").length;
  const resolvedToday = tickets.filter(t => {
    if (t.status !== "resolved") return false;
    const resolvedDate = new Date(t.updated_at);
    const today = new Date();
    return resolvedDate.toDateString() === today.toDateString();
  }).length;

  const handleStatusUpdate = async (ticketId: string, newStatus: string) => {
    try {
      const success = await updateSupportTicket(ticketId, { status: newStatus });
      if (success) {
        await loadTickets();
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket({ ...selectedTicket, status: newStatus as any });
        }
      }
    } catch (error) {
      console.error("Error updating ticket status:", error);
      alert("Failed to update ticket status");
    }
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Support"
        subtitle={loading ? "Loading tickets..." : `Manage ${tickets.length} support tickets`}
        actions={
          <Button variant="outline" size="sm" onClick={loadTickets} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-11 pr-4 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-4 gap-6">
          <Card className="p-6 border-l-4 border-l-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open Tickets</p>
                <p className="text-2xl font-bold mt-1">{openTickets}</p>
              </div>
              <AlertCircle className="h-10 w-10 text-red-500/20" />
            </div>
          </Card>
          <Card className="p-6 border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold mt-1">{inProgressTickets}</p>
              </div>
              <Clock className="h-10 w-10 text-amber-500/20" />
            </div>
          </Card>
          <Card className="p-6 border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolved Today</p>
                <p className="text-2xl font-bold mt-1">{resolvedToday}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-emerald-500/20" />
            </div>
          </Card>
          <Card className="p-6 border-l-4 border-l-primary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response</p>
                <p className="text-2xl font-bold mt-1">2.4h</p>
              </div>
              <MessageSquare className="h-10 w-10 text-primary/20" />
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Tickets List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Support Tickets</CardTitle>
                <div className="flex items-center gap-2">
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="h-9 px-3 rounded-lg border border-border bg-background text-sm"
                  >
                    <option value="all">All Tickets</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tickets found</p>
                </div>
              ) : (
                filteredTickets.map((ticket) => {
                  const userName = ticket.provider?.name || "User";
                  const isProvider = !!ticket.provider_id;
                  const timeAgo = new Date(ticket.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  
                  return (
                    <div 
                      key={ticket.id} 
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedTicket?.id === ticket.id 
                          ? "border-primary bg-primary/5" 
                          : "border-transparent bg-muted/30 hover:border-border"
                      }`}
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Avatar name={userName} size="sm" />
                          <div>
                            <p className="font-medium text-sm">{ticket.subject}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">{userName}</span>
                              {isProvider ? (
                                <Building2 className="h-3 w-3 text-muted-foreground" />
                              ) : (
                                <User className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </div>
                        {getPriorityBadge(ticket.priority)}
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-3">
                          {getStatusBadge(ticket.status)}
                          <span className="text-xs text-muted-foreground">{ticket.ticket_number || ticket.id.substring(0, 8)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{timeAgo}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Ticket Details */}
          <Card>
            <CardHeader>
              <CardTitle>Ticket Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedTicket ? (
                <div className="space-y-4">
                  <div className="p-4 bg-muted/30 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar name={selectedTicket.provider?.name || "User"} size="md" />
                      <div>
                        <p className="font-semibold">{selectedTicket.provider?.name || "User"}</p>
                        <p className="text-xs text-muted-foreground">{selectedTicket.ticket_number || selectedTicket.id.substring(0, 8)}</p>
                      </div>
                    </div>
                    <p className="font-medium mb-2">{selectedTicket.subject}</p>
                    <p className="text-sm text-muted-foreground mb-3">{selectedTicket.description}</p>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedTicket.status)}
                      {getPriorityBadge(selectedTicket.priority)}
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground">
                      <p>Category: {selectedTicket.category}</p>
                      <p>Created: {new Date(selectedTicket.created_at).toLocaleString()}</p>
                      {selectedTicket.updated_at && (
                        <p>Updated: {new Date(selectedTicket.updated_at).toLocaleString()}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 bg-muted/20 rounded-lg">
                      <p className="text-sm">{selectedTicket.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {selectedTicket.provider?.name || "User"} • {new Date(selectedTicket.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type your reply..."
                      className="flex-1 px-4 py-2 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                    />
                    <Button size="icon">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-border">
                    {selectedTicket.status !== "resolved" && (
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => handleStatusUpdate(selectedTicket.id, "resolved")}
                      >
                        Mark Resolved
                      </Button>
                    )}
                    {selectedTicket.status === "open" && (
                      <Button 
                        className="flex-1"
                        onClick={() => handleStatusUpdate(selectedTicket.id, "in_progress")}
                      >
                        Start Working
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a ticket to view details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

