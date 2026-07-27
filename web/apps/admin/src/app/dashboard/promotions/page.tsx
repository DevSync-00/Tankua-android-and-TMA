"use client";

import { useState, useEffect } from "react";
import {
  Gift,
  Plus,
  Percent,
  Calendar,
  Users,
  Tag,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  RefreshCw,
} from "lucide-react";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@tankua/ui";
import { getPromotions, deletePromotion, updatePromotion, type Promotion } from "@/lib/queries";

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    setLoading(true);
    try {
      const result = await getPromotions({ limit: 100 });
      setPromotions(result.promotions);
    } catch (error) {
      console.error("Error loading promotions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this promotion?")) {
      return;
    }
    const success = await deletePromotion(id);
    if (success) {
      loadPromotions();
    } else {
      alert("Failed to delete promotion");
    }
  };

  const handleToggleActive = async (promotion: Promotion) => {
    const success = await updatePromotion(promotion.id, { is_active: !promotion.is_active });
    if (success) {
      loadPromotions();
    } else {
      alert("Failed to update promotion");
    }
  };

  const getStatusBadge = (promotion: Promotion) => {
    const now = new Date();
    const validFrom = new Date(promotion.valid_from);
    const validUntil = new Date(promotion.valid_until);
    
    if (!promotion.is_active) {
      return <Badge variant="secondary" dot>Inactive</Badge>;
    }
    
    if (now < validFrom) {
      return <Badge variant="warning" dot>Scheduled</Badge>;
    }
    
    if (now > validUntil) {
      return <Badge variant="secondary" dot>Expired</Badge>;
    }
    
    if (promotion.usage_limit && promotion.used_count >= promotion.usage_limit) {
      return <Badge variant="secondary" dot>Limit Reached</Badge>;
    }
    
    return <Badge variant="success" dot>Active</Badge>;
  };

  const activePromos = promotions.filter(p => {
    const now = new Date();
    const validFrom = new Date(p.valid_from);
    const validUntil = new Date(p.valid_until);
    return p.is_active && now >= validFrom && now <= validUntil;
  });
  const totalUsage = promotions.reduce((sum, p) => sum + p.used_count, 0);

  return (
    <div className="min-h-screen">
      <Header
        title="Promotions"
        subtitle={loading ? "Loading promotions..." : `Manage ${promotions.length} discount codes and offers`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadPromotions} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>
              Create Promotion
            </Button>
          </div>
        }
      />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Gift className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activePromos.length}</p>
                <p className="text-sm text-muted-foreground">Active Promos</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Tag className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalUsage.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Usage</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Percent className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">18%</p>
                <p className="text-sm text-muted-foreground">Avg Discount</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">15%</p>
                <p className="text-sm text-muted-foreground">Redemption Rate</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Promotions List */}
        <Card>
          <CardHeader>
            <CardTitle>All Promotions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : promotions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No promotions found</p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="lg:hidden divide-y divide-border">
                  {promotions.map((promo) => {
                    const startDate = new Date(promo.valid_from).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    const endDate = new Date(promo.valid_until).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    
                    return (
                      <div key={promo.id} className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-mono font-semibold text-primary text-sm">{promo.code}</p>
                            <p className="text-xs text-muted-foreground mt-1 truncate">{promo.description || promo.name}</p>
                          </div>
                          {getStatusBadge(promo)}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Discount</p>
                            <Badge variant="secondary" className="mt-1">
                              {promo.discount_type === "percentage" ? `${promo.discount_value}%` : `ETB ${promo.discount_value}`}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Usage</p>
                            <p className="font-medium text-sm mt-1">{promo.used_count.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">
                              {promo.usage_limit ? `of ${promo.usage_limit}` : "unlimited"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
                          <Calendar className="h-3 w-3" />
                          <span className="truncate">{startDate} - {endDate}</span>
                        </div>
                        <div className="flex items-center justify-end gap-1 pt-2 border-t border-border">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8" 
                            title="Copy code"
                            onClick={() => {
                              navigator.clipboard.writeText(promo.code);
                              alert("Code copied to clipboard!");
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive" 
                            title="Delete"
                            onClick={() => handleDelete(promo.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Desktop Table View */}
                {!loading && promotions.length > 0 && (
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Code</th>
                          <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Discount</th>
                          <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Usage</th>
                          <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Period</th>
                          <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                          <th className="text-left py-4 px-6"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {promotions.map((promo) => {
                          const startDate = new Date(promo.valid_from).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                          const endDate = new Date(promo.valid_until).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                          
                          return (
                            <tr key={promo.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                              <td className="py-4 px-6">
                                <div>
                                  <p className="font-mono font-semibold text-primary">{promo.code}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{promo.description || promo.name}</p>
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <Badge variant="secondary">
                                  {promo.discount_type === "percentage" ? `${promo.discount_value}%` : `ETB ${promo.discount_value}`}
                                </Badge>
                              </td>
                              <td className="py-4 px-6">
                                <div>
                                  <p className="font-medium text-sm">{promo.used_count.toLocaleString()}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {promo.usage_limit ? `of ${promo.usage_limit} limit` : "unlimited"}
                                  </p>
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Calendar className="h-4 w-4" />
                                  <span>{startDate} - {endDate}</span>
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                {getStatusBadge(promo)}
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8" 
                                    title="Copy code"
                                    onClick={() => {
                                      navigator.clipboard.writeText(promo.code);
                                      alert("Code copied to clipboard!");
                                    }}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-destructive" 
                                    title="Delete"
                                    onClick={() => handleDelete(promo.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

