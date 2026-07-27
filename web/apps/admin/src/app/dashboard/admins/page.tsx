"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Shield,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  CheckCircle,
  X,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Avatar, Input } from "@tankua/ui";
import {
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  updateAdminPassword,
  type AdminUser,
} from "@/lib/queries";

export default function AdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Add admin form state
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    phone: "",
    role: "admin" as "super_admin" | "admin" | "support" | "finance",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");
  const [adding, setAdding] = useState(false);

  // Edit admin form state
  const [editAdmin, setEditAdmin] = useState({
    name: "",
    phone: "",
    role: "admin" as "super_admin" | "admin" | "support" | "finance",
    is_active: true,
  });
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [editing, setEditing] = useState(false);

  // Password change state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Get current admin from localStorage
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const isSuperAdmin = currentAdmin?.role === "super_admin";

  useEffect(() => {
    const adminData = localStorage.getItem("admin_user");
    if (adminData) {
      try {
        setCurrentAdmin(JSON.parse(adminData));
      } catch (e) {
        console.error("Failed to parse admin user", e);
      }
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [searchQuery, roleFilter, currentPage]);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const result = await getAdminUsers({
        search: searchQuery || undefined,
        role: roleFilter || undefined,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      });
      setAdmins(result.admins);
      setTotal(result.total);
    } catch (error) {
      console.error("Error fetching admins:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    setAddSuccess("");
    setAdding(true);

    // Validation
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      setAddError("Name, email, and password are required");
      setAdding(false);
      return;
    }

    if (newAdmin.password.length < 8) {
      setAddError("Password must be at least 8 characters long");
      setAdding(false);
      return;
    }

    if (newAdmin.password !== newAdmin.confirmPassword) {
      setAddError("Passwords do not match");
      setAdding(false);
      return;
    }

    try {
      const result = await createAdminUser({
        name: newAdmin.name,
        email: newAdmin.email,
        phone: newAdmin.phone || undefined,
        role: newAdmin.role,
        password: newAdmin.password,
      });

      if (result.success) {
        setAddSuccess(
          result.authWarning
            ? `Admin created! ${result.authWarning}`
            : "Admin created successfully!"
        );
        setNewAdmin({
          name: "",
          email: "",
          phone: "",
          role: "admin",
          password: "",
          confirmPassword: "",
        });
        setTimeout(() => {
          setShowAddModal(false);
          setAddSuccess("");
          fetchAdmins();
        }, 2000);
      } else {
        setAddError(result.error || "Failed to create admin");
      }
    } catch (err: any) {
      setAddError(err.message || "An error occurred");
    } finally {
      setAdding(false);
    }
  };

  const handleEditAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin) return;

    setEditError("");
    setEditSuccess("");
    setEditing(true);

    try {
      const success = await updateAdminUser(selectedAdmin.id, {
        name: editAdmin.name,
        role: editAdmin.role,
        phone: editAdmin.phone || undefined,
        is_active: editAdmin.is_active,
      });

      if (success) {
        setEditSuccess("Admin updated successfully!");
        setTimeout(() => {
          setShowEditModal(false);
          setEditSuccess("");
          fetchAdmins();
        }, 1500);
      } else {
        setEditError("Failed to update admin");
      }
    } catch (err: any) {
      setEditError(err.message || "An error occurred");
    } finally {
      setEditing(false);
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this admin?")) return;

    try {
      const success = await deleteAdminUser(id);
      if (success) {
        fetchAdmins();
      }
    } catch (error) {
      console.error("Error deleting admin:", error);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin) return;

    setPasswordError("");
    setPasswordSuccess("");
    setChangingPassword(true);

    if (!newPassword || !confirmPassword) {
      setPasswordError("All fields are required");
      setChangingPassword(false);
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      setChangingPassword(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      setChangingPassword(false);
      return;
    }

    try {
      const result = await updateAdminPassword(selectedAdmin.email, newPassword);

      if (result.success) {
        setPasswordSuccess("Password updated successfully!");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordSuccess("");
        }, 1500);
      } else {
        setPasswordError(result.error || "Failed to update password");
      }
    } catch (err: any) {
      setPasswordError(err.message || "An error occurred");
    } finally {
      setChangingPassword(false);
    }
  };

  const openEditModal = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setEditAdmin({
      name: admin.name,
      phone: admin.phone || "",
      role: admin.role,
      is_active: admin.is_active,
    });
    setShowEditModal(true);
  };

  const openPasswordModal = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setNewPassword("");
    setConfirmPassword("");
    setShowPasswordModal(true);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "admin":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "support":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "finance":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  const filteredAdmins = admins.filter((admin) => {
    const matchesSearch =
      !searchQuery ||
      admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !roleFilter || admin.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen">
        <Header title="Admins" subtitle="Manage admin users" />
        <div className="p-6">
          <Card>
            <CardContent className="p-12 text-center">
              <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Access Denied</h3>
              <p className="text-muted-foreground">
                Only super admins can manage admin users.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Admin Users"
        subtitle="Manage platform administrators"
        actions={
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setShowAddModal(true);
              setAddError("");
              setAddSuccess("");
            }}
          >
            Add Admin
          </Button>
        }
      />

      <div className="p-6">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search admins..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-background"
              >
                <option value="">All Roles</option>
                <option value="super_admin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="support">Support</option>
                <option value="finance">Finance</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Admins Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Admins ({total})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : filteredAdmins.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No admins found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Admin</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Role</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Last Login</th>
                      <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdmins.map((admin) => (
                      <tr key={admin.id} className="border-b border-border hover:bg-muted/30">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={admin.name} size="sm" />
                            <div>
                              <p className="font-medium">{admin.name}</p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {admin.email}
                              </p>
                              {admin.phone && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {admin.phone}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge className={getRoleBadgeColor(admin.role)}>
                            {admin.role.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge
                            className={
                              admin.is_active
                                ? "bg-green-500/10 text-green-400 border-green-500/20"
                                : "bg-red-500/10 text-red-400 border-red-500/20"
                            }
                          >
                            {admin.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {admin.last_login
                            ? new Date(admin.last_login).toLocaleDateString()
                            : "Never"}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(admin)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openPasswordModal(admin)}
                            >
                              <Lock className="h-4 w-4" />
                            </Button>
                            {admin.id !== currentAdmin?.id && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteAdmin(admin.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {total > itemsPerPage && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, total)} of {total} admins
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={currentPage * itemsPerPage >= total}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Add New Admin</CardTitle>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setAddError("");
                    setAddSuccess("");
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddAdmin} className="space-y-4">
                {addError && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p>{addError}</p>
                  </div>
                )}

                {addSuccess && (
                  <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <p>{addSuccess}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <Input
                    value={newAdmin.name}
                    onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <Input
                    type="email"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phone (Optional)</label>
                  <Input
                    type="tel"
                    value={newAdmin.phone}
                    onChange={(e) => setNewAdmin({ ...newAdmin, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Role</label>
                  <select
                    value={newAdmin.role}
                    onChange={(e) =>
                      setNewAdmin({
                        ...newAdmin,
                        role: e.target.value as "super_admin" | "admin" | "support" | "finance",
                      })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-background"
                  >
                    <option value="admin">Admin</option>
                    <option value="support">Support</option>
                    <option value="finance">Finance</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={newAdmin.password}
                      onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                      placeholder="Enter password (min. 8 characters)"
                      required
                      className="pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Confirm Password</label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={newAdmin.confirmPassword}
                    onChange={(e) => setNewAdmin({ ...newAdmin, confirmPassword: e.target.value })}
                    placeholder="Confirm password"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowAddModal(false);
                      setAddError("");
                      setAddSuccess("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" isLoading={adding}>
                    Create Admin
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Admin Modal */}
      {showEditModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Edit Admin</CardTitle>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditError("");
                    setEditSuccess("");
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEditAdmin} className="space-y-4">
                {editError && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p>{editError}</p>
                  </div>
                )}

                {editSuccess && (
                  <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <p>{editSuccess}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <Input
                    value={editAdmin.name}
                    onChange={(e) => setEditAdmin({ ...editAdmin, name: e.target.value })}
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <Input
                    type="email"
                    value={selectedAdmin.email}
                    disabled
                    className="bg-muted/50"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <Input
                    type="tel"
                    value={editAdmin.phone}
                    onChange={(e) => setEditAdmin({ ...editAdmin, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Role</label>
                  <select
                    value={editAdmin.role}
                    onChange={(e) =>
                      setEditAdmin({
                        ...editAdmin,
                        role: e.target.value as "super_admin" | "admin" | "support" | "finance",
                      })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-background"
                  >
                    <option value="admin">Admin</option>
                    <option value="support">Support</option>
                    <option value="finance">Finance</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editAdmin.is_active}
                      onChange={(e) =>
                        setEditAdmin({ ...editAdmin, is_active: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-border"
                    />
                    <span className="text-sm font-medium">Active</span>
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditError("");
                      setEditSuccess("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" isLoading={editing}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Change Password for {selectedAdmin.name}</CardTitle>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordError("");
                    setPasswordSuccess("");
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                {passwordError && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p>{passwordError}</p>
                  </div>
                )}

                {passwordSuccess && (
                  <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <p>{passwordSuccess}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">New Password</label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min. 8 characters)"
                      required
                      className="pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordError("");
                      setPasswordSuccess("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" isLoading={changingPassword}>
                    Update Password
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

