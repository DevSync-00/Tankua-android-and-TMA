"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Shield,
  Calendar,
  RefreshCw,
  Edit,
  Trash2,
  X,
  Save,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Avatar, Input, ConfirmDialog } from "@tankua/ui";
import { getUsers, updateUser, deleteUser, type User } from "@/lib/queries";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone_number: "",
    is_admin: false,
  });

  useEffect(() => {
    loadUsers();
  }, [page, search]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const result = await getUsers({
        limit,
        offset: (page - 1) * limit,
        search: search || undefined,
      });
      setUsers(result.users);
      setTotal(result.total);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      phone_number: user.phone_number,
      is_admin: user.is_admin || false,
    });
    setError("");
    setSuccess("");
    setShowEditModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const success = await updateUser(selectedUser.id, {
        name: formData.name || null,
        email: formData.email || null,
        phone_number: formData.phone_number,
        is_admin: formData.is_admin,
      });

      if (success) {
        setSuccess("User updated successfully!");
        setTimeout(() => {
          setShowEditModal(false);
          loadUsers();
        }, 1500);
      } else {
        setError("Failed to update user");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const executeDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      const success = await deleteUser(deleteConfirmId);
      if (success) {
        loadUsers();
      } else {
        setError("Failed to delete user account.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete user.");
    } finally {
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Users"
        subtitle={`Manage ${total.toLocaleString()} registered users`}
        actions={
          <Button variant="outline" size="sm" onClick={loadUsers}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <Button variant="outline" leftIcon={<Filter className="h-4 w-4" />}>
            Filters
          </Button>
        </div>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No users found</p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="lg:hidden divide-y divide-border">
                  {users.map((user) => (
                    <div key={user.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar name={user.name || user.phone_number} size="md" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{user.name || "No name"}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {user.id.substring(0, 8)}...
                            </p>
                          </div>
                        </div>
                        {user.is_admin ? (
                          <Badge variant="default" className="gap-1">
                            <Shield className="h-3 w-3" />
                            Admin
                          </Badge>
                        ) : (
                          <Badge variant="secondary">User</Badge>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{user.phone_number}</span>
                        </div>
                        {user.email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{user.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          <span>{formatDate(user.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2 border-t border-border">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(user.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          User
                        </th>
                        <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Role
                        </th>
                        <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Joined
                        </th>
                        <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr
                          key={user.id}
                          className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <Avatar name={user.name || user.phone_number} size="md" />
                              <div>
                                <p className="font-medium">{user.name || "No name"}</p>
                                <p className="text-xs text-muted-foreground">
                                  {user.id.substring(0, 8)}...
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                <span>{user.phone_number}</span>
                              </div>
                              {user.email && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Mail className="h-3 w-3" />
                                  <span>{user.email}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            {user.is_admin ? (
                              <Badge variant="default" className="gap-1">
                                <Shield className="h-3 w-3" />
                                Admin
                              </Badge>
                            ) : (
                              <Badge variant="secondary">User</Badge>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(user.created_at)}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground text-center sm:text-left">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} users
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

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Edit User</CardTitle>
                <button
                  onClick={() => {
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
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <p>{success}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number *</label>
                  <Input
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    placeholder="Phone number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Full name"
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

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_admin}
                      onChange={(e) => setFormData({ ...formData, is_admin: e.target.checked })}
                      className="w-4 h-4 rounded border-border"
                    />
                    <span className="text-sm font-medium">Admin User</span>
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowEditModal(false);
                      setError("");
                      setSuccess("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" isLoading={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    Update
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        title="Delete User Account"
        description="Are you sure you want to delete this user account? This action cannot be undone."
        confirmText="Delete User"
        cancelText="Cancel"
        variant="danger"
        onConfirm={executeDelete}
      />
    </div>
  );
}


