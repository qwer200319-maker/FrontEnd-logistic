import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  History, 
  Search, 
  Filter,
  Download,
  Eye,
  User,
  Settings,
  Package,
  FileText
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import { format } from "date-fns";
import api from "@/lib/api";

interface AuditLog {
  id: number;
  user: {
    id: number;
    full_name: string;
    email: string;
  };
  action: string;
  resource_type: string;
  resource_id: number;
  ip_address: string;
  user_agent: string;
  timestamp: string;
  details: string;
}

const AuditLogsPage = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [resourceFilter, setResourceFilter] = useState("all");

  // Mock data for demonstration
  const mockLogs: AuditLog[] = [
    {
      id: 1,
      user: { id: 1, full_name: "Admin User", email: "admin@example.com" },
      action: "CREATE",
      resource_type: "User",
      resource_id: 5,
      ip_address: "192.168.1.100",
      user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124",
      timestamp: "2023-06-15T10:30:00Z",
      details: "Created new user account for John Doe"
    },
    {
      id: 2,
      user: { id: 1, full_name: "Admin User", email: "admin@example.com" },
      action: "UPDATE",
      resource_type: "Order",
      resource_id: 123,
      ip_address: "192.168.1.100",
      user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124",
      timestamp: "2023-06-15T09:15:00Z",
      details: "Updated order status to 'In Transit'"
    },
    {
      id: 3,
      user: { id: 2, full_name: "Customer User", email: "customer@example.com" },
      action: "LOGIN",
      resource_type: "Auth",
      resource_id: 0,
      ip_address: "192.168.1.105",
      user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) Safari/605.1.15",
      timestamp: "2023-06-15T08:45:00Z",
      details: "User logged in successfully"
    },
    {
      id: 4,
      user: { id: 1, full_name: "Admin User", email: "admin@example.com" },
      action: "DELETE",
      resource_type: "Invoice",
      resource_id: 45,
      ip_address: "192.168.1.100",
      user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124",
      timestamp: "2023-06-14T16:20:00Z",
      details: "Deleted invoice due to cancellation"
    },
    {
      id: 5,
      user: { id: 3, full_name: "Manager User", email: "manager@example.com" },
      action: "UPDATE",
      resource_type: "Settings",
      resource_id: 0,
      ip_address: "192.168.1.110",
      user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_4_0) Chrome/91.0.4472.124",
      timestamp: "2023-06-14T14:10:00Z",
      details: "Updated system notification settings"
    }
  ];

  useEffect(() => {
    // In a real application, this would fetch from an API
    // For now, we'll use mock data
    try {
      setLogs(mockLogs);
      setFilteredLogs(mockLogs);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      setError("Failed to load audit logs. Please try again.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let result = logs;
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(log => 
        log.user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply action filter
    if (actionFilter !== "all") {
      result = result.filter(log => log.action === actionFilter);
    }
    
    // Apply resource filter
    if (resourceFilter !== "all") {
      result = result.filter(log => log.resource_type === resourceFilter);
    }
    
    setFilteredLogs(result);
  }, [logs, searchTerm, actionFilter, resourceFilter]);

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case "CREATE": return "default";
      case "UPDATE": return "secondary";
      case "DELETE": return "destructive";
      case "LOGIN": return "outline";
      case "LOGOUT": return "outline";
      default: return "secondary";
    }
  };

  const getResourceIcon = (resourceType: string) => {
    switch (resourceType) {
      case "User": return <User className="h-4 w-4" />;
      case "Order": return <Package className="h-4 w-4" />;
      case "Invoice": return <FileText className="h-4 w-4" />;
      case "Settings": return <Settings className="h-4 w-4" />;
      case "Auth": return <User className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const exportLogs = () => {
    // In a real application, this would export the logs to a file
    console.log("Exporting logs:", filteredLogs);
    alert("Logs exported successfully! (This is a demo)");
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="ml-4 text-muted-foreground">Loading audit logs...</p>
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
            <h1 className="text-3xl font-bold text-foreground">Audit Logs</h1>
            <p className="text-muted-foreground">View system activity and user actions</p>
          </div>
          <Button onClick={exportLogs} className="bg-gradient-primary hover:shadow-primary">
            <Download className="mr-2 h-4 w-4" />
            Export Logs
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
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <select
                  className="p-2 border rounded-md bg-background"
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  aria-label="Filter by action"
                >
                  <option value="all">All Actions</option>
                  <option value="CREATE">Create</option>
                  <option value="UPDATE">Update</option>
                  <option value="DELETE">Delete</option>
                  <option value="LOGIN">Login</option>
                  <option value="LOGOUT">Logout</option>
                </select>
                <select
                  className="p-2 border rounded-md bg-background"
                  value={resourceFilter}
                  onChange={(e) => setResourceFilter(e.target.value)}
                  aria-label="Filter by resource"
                >
                  <option value="all">All Resources</option>
                  <option value="User">User</option>
                  <option value="Order">Order</option>
                  <option value="Invoice">Invoice</option>
                  <option value="Settings">Settings</option>
                  <option value="Auth">Authentication</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <History className="h-5 w-5" />
              <span>Activity Log</span>
            </CardTitle>
            <CardDescription>
              Detailed record of system events and user actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="font-medium">{log.user.full_name}</div>
                        <div className="text-sm text-muted-foreground">{log.user.email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          {getResourceIcon(log.resource_type)}
                          <span>{log.resource_type} #{log.resource_id || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{log.ip_address}</TableCell>
                      <TableCell>
                        {format(new Date(log.timestamp), "MMM dd, yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="text-sm text-muted-foreground truncate">
                          {log.details}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredLogs.length === 0 && (
              <div className="text-center py-12">
                <History className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No audit logs found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || actionFilter !== "all" || resourceFilter !== "all"
                    ? "Try adjusting your filters or search terms."
                    : "No audit logs available in the system."
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Total Users</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">24</div>
              <p className="text-sm text-muted-foreground">Active users in the system</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Total Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">1,248</div>
              <p className="text-sm text-muted-foreground">Actions in the last 30 days</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>System Events</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">142</div>
              <p className="text-sm text-muted-foreground">Configuration changes</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default AuditLogsPage;