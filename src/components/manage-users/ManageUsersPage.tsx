import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Eye,
  EyeOff,
  Shield
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

interface Permission {
  id: number;
  name: string;
  description: string;
  codename: string;
}

interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  date_joined: string;
  custom_permissions: Permission[];
  admin?: number | null; // Optional admin field for customers, can be number or null
}

const ManageUsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [admins, setAdmins] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    role: "customer",
    password: "",
    is_active: true,
    admin: ""
  });
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get<User[]>("/users/");
      setUsers(response.data);
      setFilteredUsers(response.data);
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError("Failed to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await api.get<Permission[]>("/permissions/");
      setPermissions(response.data);
    } catch (err: any) {
      console.error("Error fetching permissions:", err);
      toast({
        title: "Error",
        description: "Failed to load permissions. Please try again.",
        variant: "destructive",
      });
    }
  };

  const fetchAdmins = async () => {
    try {
      const response = await api.get<User[]>("/users/?role=admin");
      setAdmins(response.data);
    } catch (err: any) {
      console.error("Error fetching admins:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchPermissions();
    fetchAdmins();
  }, []);

  useEffect(() => {
    let result = users;
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(user =>
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply role filter
    if (roleFilter !== "all") {
      result = result.filter(user => user.role === roleFilter);
    }
    
    setFilteredUsers(result);
  }, [users, searchTerm, roleFilter]);

  const handleCreateUser = async () => {
    try {
      // Prepare data for API call
      const userData: any = { ...formData };
      if (userData.role === "customer" && userData.admin) {
        // Convert admin string to number for API
        const adminId = parseInt(userData.admin, 10);
        if (!isNaN(adminId)) {
          userData.admin = adminId;
        } else {
          // If admin is not a valid number, remove the field
          delete userData.admin;
        }
      } else if (userData.role === "admin") {
        // Remove admin field for admin users
        delete userData.admin;
      }
      
      const response = await api.post<User>("/users/", userData);
      setUsers([...users, response.data]);
      toast({
        title: "User Created",
        description: `User ${response.data.full_name} has been created successfully.`,
      });
      resetForm();
      setIsDialogOpen(false);
    } catch (err: any) {
      console.error("Error creating user:", err);
      toast({
        title: "Error",
        description: "Failed to create user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    
    try {
      // Prepare data for API call
      const userData: any = { ...formData };
      if (userData.role === "customer" && userData.admin) {
        // Convert admin string to number for API
        const adminId = parseInt(userData.admin, 10);
        if (!isNaN(adminId)) {
          userData.admin = adminId;
        } else {
          // If admin is not a valid number, remove the field
          delete userData.admin;
        }
      } else if (userData.role === "admin") {
        // Remove admin field for admin users
        delete userData.admin;
      }
      
      const response = await api.patch<User>(`/users/${editingUser.id}/`, userData);
      setUsers(users.map(user => user.id === editingUser.id ? response.data : user));
      toast({
        title: "User Updated",
        description: `User ${response.data.full_name} has been updated successfully.`,
      });
      resetForm();
      setIsDialogOpen(false);
    } catch (err: any) {
      console.error("Error updating user:", err);
      toast({
        title: "Error",
        description: "Failed to update user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      await api.delete(`/users/${userId}/`);
      setUsers(users.filter(user => user.id !== userId));
      toast({
        title: "User Deleted",
        description: "User has been deleted successfully.",
      });
    } catch (err: any) {
      console.error("Error deleting user:", err);
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddPermission = async (userId: number, permissionId: number) => {
    try {
      await api.post(`/users/${userId}/add_permission/`, { permission_id: permissionId });
      toast({
        title: "Permission Added",
        description: "Permission has been added to the user.",
      });
      // Refresh user data
      fetchUsers();
    } catch (err: any) {
      console.error("Error adding permission:", err);
      toast({
        title: "Error",
        description: "Failed to add permission. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemovePermission = async (userId: number, permissionId: number) => {
    try {
      await api.post(`/users/${userId}/remove_permission/`, { permission_id: permissionId });
      toast({
        title: "Permission Removed",
        description: "Permission has been removed from the user.",
      });
      // Refresh user data
      fetchUsers();
    } catch (err: any) {
      console.error("Error removing permission:", err);
      toast({
        title: "Error",
        description: "Failed to remove permission. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: "",
      email: "",
      role: "customer",
      password: "",
      is_active: true,
      admin: ""
    });
    setEditingUser(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setFormData({
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      password: "",
      is_active: user.is_active,
      admin: user.admin ? user.admin.toString() : ""
    });
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const openPermissionDialog = (user: User) => {
    setSelectedUser(user);
    // Initialize selected permissions with user's current permissions
    setSelectedPermissions(user.custom_permissions.map(p => p.id));
    setIsPermissionDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      handleUpdateUser();
    } else {
      handleCreateUser();
    }
  };

  const handlePermissionSubmit = () => {
    if (!selectedUser) return;
    
    // Add new permissions
    selectedPermissions.forEach(permissionId => {
      if (!selectedUser.custom_permissions.some(p => p.id === permissionId)) {
        handleAddPermission(selectedUser.id, permissionId);
      }
    });
    
    // Remove permissions that were unchecked
    selectedUser.custom_permissions.forEach(permission => {
      if (!selectedPermissions.includes(permission.id)) {
        handleRemovePermission(selectedUser.id, permission.id);
      }
    });
    
    setIsPermissionDialogOpen(false);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin": return "default";
      case "customer": return "secondary";
      default: return "outline";
    }
  };

  const handlePermissionChange = (permissionId: number, checked: boolean) => {
    // Special handling for Reports page - when allowing access, also hide navbar
    const reportsPerm = permissions.find(p => p.codename === 'hide_reports');
    const navbarPerm = permissions.find(p => p.codename === 'hide_navbar');
    
    if (reportsPerm && navbarPerm && permissionId === reportsPerm.id && checked) {
      // When enabling Reports access, also enable Navbar hiding
      if (checked) {
        setSelectedPermissions(prev => {
          const newPermissions = [...prev];
          if (!newPermissions.includes(permissionId)) {
            newPermissions.push(permissionId);
          }
          if (!newPermissions.includes(navbarPerm.id)) {
            newPermissions.push(navbarPerm.id);
          }
          return newPermissions;
        });
      } else {
        setSelectedPermissions(prev => prev.filter(id => id !== permissionId));
      }
    } else {
      // Normal permission handling
      if (checked) {
        setSelectedPermissions(prev => [...prev, permissionId]);
      } else {
        setSelectedPermissions(prev => prev.filter(id => id !== permissionId));
      }
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="ml-4 text-muted-foreground">Loading users...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Manage Users</h1>
            <p className="text-muted-foreground">View and manage all system users</p>
          </div>
          <Button onClick={openCreateDialog} className="bg-gradient-primary hover:shadow-primary">
            <Plus className="mr-2 h-4 w-4" />
            Add New User
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="shadow-card border-destructive">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 text-destructive">
                <Eye className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>User List</span>
            </CardTitle>
            <CardDescription>
              Manage all users in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? "default" : "secondary"}>
                          {user.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.role === "customer" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPermissionDialog(user)}
                          >
                            <Shield className="h-4 w-4 mr-1" />
                            {user.custom_permissions.length} Permissions
                          </Button>
                        )}
                        {user.role === "admin" && (
                          <span className="text-muted-foreground">Admin has all permissions</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(user.date_joined).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={user.id === 1} // Prevent deleting the first user (likely admin)
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No users found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || roleFilter !== "all"
                    ? "Try adjusting your filters or search terms."
                    : "No users available in the system."
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Form Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingUser ? "Edit User" : "Create New User"}</DialogTitle>
              <DialogDescription>
                {editingUser
                  ? "Update user details here. Click save when you're done."
                  : "Enter user details here. Click create when you're done."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="full_name" className="text-right">
                    Full Name
                  </Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">
                    Role
                  </Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="customer">Customer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.role === "customer" && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="admin" className="text-right">
                      Admin
                    </Label>
                    <Select
                      value={formData.admin}
                      onValueChange={(value) => setFormData({...formData, admin: value})}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select admin" />
                      </SelectTrigger>
                      <SelectContent>
                        {admins.map((admin) => (
                          <SelectItem key={admin.id} value={admin.id.toString()}>
                            {admin.full_name} ({admin.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {!editingUser && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="password" className="text-right">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="col-span-3"
                      required={!editingUser}
                    />
                  </div>
                )}
                {editingUser && formData.password && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="password" className="text-right">
                      New Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="col-span-3"
                      placeholder="Leave blank to keep current password"
                    />
                  </div>
                )}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="is_active" className="text-right">
                    Status
                  </Label>
                  <Select
                    value={formData.is_active ? "active" : "inactive"}
                    onValueChange={(value) => setFormData({...formData, is_active: value === "active"})}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">
                  {editingUser ? "Update User" : "Create User"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Permission Dialog */}
        <Dialog open={isPermissionDialogOpen} onOpenChange={setIsPermissionDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Manage Permissions</DialogTitle>
              <DialogDescription>
                {selectedUser ? `Manage permissions for ${selectedUser.full_name}` : ""}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              {/* Page Visibility Permissions */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Page Access Permissions</h4>
                {permissions
                  .filter(permission => [
                    'hide_navbar',
                    'hide_dashboard',
                    'hide_orders',
                    'hide_payments',
                    'hide_reports'
                  ].includes(permission.codename))
                  .map((permission) => (
                    <div key={permission.id} className="flex items-center space-x-2 mb-1">
                      <Checkbox
                        id={`permission-${permission.id}`}
                        checked={selectedPermissions.includes(permission.id)}
                        onCheckedChange={(checked) => handlePermissionChange(permission.id, !!checked)}
                      />
                      <Label htmlFor={`permission-${permission.id}`} className="font-medium">
                        {permission.name}
                      </Label>
                    </div>
                  ))
                }
              </div>
              
              {/* Reports Metric Permissions */}
              <div className="border-t border-border my-2 pt-2">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Reports Metric Permissions</h4>
                {permissions
                  .filter(permission => [
                    'hide_reports_total_orders',
                    'hide_reports_revenue',
                    'hide_reports_delivered',
                    'hide_reports_in_progress',
                    // 'hide_reports_amount'
                  ].includes(permission.codename))
                  .map((permission) => (
                    <div key={permission.id} className="flex items-center space-x-2 mb-1">
                      <Checkbox
                        id={`permission-${permission.id}`}
                        checked={selectedPermissions.includes(permission.id)}
                        onCheckedChange={(checked) => handlePermissionChange(permission.id, !!checked)}
                      />
                      <Label htmlFor={`permission-${permission.id}`} className="font-medium">
                        {permission.name}
                      </Label>
                    </div>
                  ))
                }
              </div>
              
              {/* Payments Metric Permissions */}
              <div className="border-t border-border my-2 pt-2">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Payments Metric Permissions</h4>
                {permissions
                  .filter(permission => [
                    'hide_payments_total_revenue',
                    'hide_payments_pending_revenue',
                    'hide_payments_success_rate',
                    'hide_payments_amount_method'
                  ].includes(permission.codename))
                  .map((permission) => (
                    <div key={permission.id} className="flex items-center space-x-2 mb-1">
                      <Checkbox
                        id={`permission-${permission.id}`}
                        checked={selectedPermissions.includes(permission.id)}
                        onCheckedChange={(checked) => handlePermissionChange(permission.id, !!checked)}
                      />
                      <Label htmlFor={`permission-${permission.id}`} className="font-medium">
                        {permission.name}
                      </Label>
                    </div>
                  ))
                }
              </div>
              
              {/* Other Operation Permissions */}
              {/* <div className="border-t border-border my-2 pt-2">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Other Operation Permissions</h4>
                {permissions
                  .filter(permission => ![
                    'hide_navbar',
                    'hide_dashboard',
                    'hide_orders',
                    'hide_payments',
                    'hide_reports',
                    'hide_reports_total_orders',
                    'hide_reports_revenue',
                    'hide_reports_delivered',
                    'hide_reports_in_progress',
                    'hide_reports_amount',
                    'hide_payments_total_revenue',
                    'hide_payments_pending_revenue',
                    'hide_payments_success_rate',
                    'hide_payments_amount_method'
                  ].includes(permission.codename))
                  .map((permission) => (
                    <div key={permission.id} className="flex items-center space-x-2 mb-1">
                      <Checkbox
                        id={`permission-${permission.id}`}
                        checked={selectedPermissions.includes(permission.id)}
                        onCheckedChange={(checked) => handlePermissionChange(permission.id, !!checked)}
                      />
                      <Label htmlFor={`permission-${permission.id}`} className="font-medium">
                        {permission.name}
                      </Label>
                    </div>
                  ))
                }
              </div> */}
            </div>
            <DialogFooter>
              <Button onClick={handlePermissionSubmit}>Save Permissions</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default ManageUsersPage;