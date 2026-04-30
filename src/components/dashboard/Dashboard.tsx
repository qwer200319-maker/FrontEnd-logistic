import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Plus,
  Eye,
  AlertCircle,
  Users,
  Settings,
  History
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import api from "@/lib/api";
import { getUserRole } from "@/lib/auth";

interface DashboardStats {
  totalOrders: number;
  inTransit: number;
  delivered: number;
  pending: number;
  totalRevenue: number;
  monthlyGrowth: number;
  totalCustomers?: number; // Optional for backward compatibility
}

interface RecentOrder {
  id: string;
  product_name: string;
  customer: string;
  status: "pending" | "in_transit" | "delivered";
  amount: number;
  shipping_cost?: number;
  shipping_fee?: number;
  date: string;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    inTransit: 0,
    delivered: 0,
    pending: 0,
    totalRevenue: 0,
    monthlyGrowth: 0,
  });

  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    // Check if user is authenticated
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please login to access dashboard");
      navigate("/login");
      return;
    }

    try {
      // Fetch dashboard stats and recent orders from reports API
      const [statsResponse, ordersResponse] = await Promise.all([
        api.get('/reports/dashboard_stats/?period=monthly'),
        api.get('/reports/recent_orders/?period=monthly&limit=5')
      ]);

      // Set dashboard statistics
      setStats({
        totalOrders: statsResponse.data.total_orders || 0,
        inTransit: statsResponse.data.in_transit_orders || 0,
        delivered: statsResponse.data.delivered_orders || 0,
        pending: statsResponse.data.pending_orders || 0,
        totalRevenue: statsResponse.data.revenue || 0,
        totalCustomers: statsResponse.data.total_customers || 0, // Add customer count
        monthlyGrowth: 12.5, // Mock growth percentage - could be calculated from historical data
      });

      // Set recent orders
      setRecentOrders(ordersResponse.data);

    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
      
      if (err.response?.status === 401) {
        setError("Authentication required. Please login again.");
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError("Failed to load dashboard data. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [navigate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-success text-success-foreground";
      case "in_transit":
        return "bg-warning text-warning-foreground";
      case "pending":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "delivered":
        return "Delivered";
      case "in_transit":
        return "In Transit";
      case "pending":
        return "Pending";
      default:
        return "Unknown";
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="ml-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Error Display */}
        {error && (
          <Card className="shadow-card border-destructive">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's your logistics overview.</p>
          </div>
          <Link to="/orders/create">
            <Button className="bg-gradient-primary hover:shadow-primary">
              <Plus className="mr-2 h-4 w-4" />
              Create Order
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        {getUserRole() === "admin" ? (
          // Admin-specific stats
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                    {stats.totalCustomers ? stats.totalCustomers.toLocaleString() : "0"}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-success flex items-center">
                    {/* <TrendingUp className="h-3 w-3 mr-1" /> */}
                    Total registered customers
                  </span>
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(stats.totalOrders || 0).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-success flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +{stats.monthlyGrowth}% from last month
                  </span>
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${(stats.totalRevenue || 0).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Total this month
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
                <Settings className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Operational</div>
                <p className="text-xs text-muted-foreground">
                  All systems running smoothly
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Customer-specific stats
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(stats.totalOrders || 0).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-success flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +{stats.monthlyGrowth}% from last month
                  </span>
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Transit</CardTitle>
                <Truck className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.inTransit}</div>
                <p className="text-xs text-muted-foreground">
                  Currently being delivered
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Delivered</CardTitle>
                <CheckCircle className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(stats.delivered || 0).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Successfully completed
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${(stats.totalRevenue || 0).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Total this month
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Orders */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest order activities</CardDescription>
              </div>
              <Link to="/orders">
                <Button variant="outline" size="sm">
                  <Eye className="mr-2 h-4 w-4" />
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-gradient-primary p-2 rounded-lg">
                      <Package className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{order.product_name}</p>
                      <p className="text-sm text-muted-foreground">{order.customer}</p>
                      <p className="text-xs text-muted-foreground">{order.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end space-x-4 mt-2 sm:mt-0">
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusLabel(order.status)}
                    </Badge>
                    <div className="text-right">
                      <p className="font-medium">${((order.shipping_cost || 0) + (order.shipping_fee || 0)).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{order.date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        {getUserRole() === "admin" ? (
          // Admin-specific quick actions
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-card hover:shadow-primary transition-shadow cursor-pointer">
              <Link to="/users">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gradient-primary p-3 rounded-lg">
                      <Users className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium">Manage Users</h3>
                      <p className="text-sm text-muted-foreground">Add/edit user accounts</p>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>

            <Card className="shadow-card hover:shadow-primary transition-shadow cursor-pointer">
              <Link to="/settings">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-warning p-3 rounded-lg">
                      <Settings className="h-6 w-6 text-warning-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium">System Settings</h3>
                      <p className="text-sm text-muted-foreground">Configure system parameters</p>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>

            <Card className="shadow-card hover:shadow-primary transition-shadow cursor-pointer">
              <Link to="/audit">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-success p-3 rounded-lg">
                      <History className="h-6 w-6 text-success-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium">Audit Logs</h3>
                      <p className="text-sm text-muted-foreground">View system activity logs</p>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          </div>
        ) : (
          // Customer-specific quick actions
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-card hover:shadow-primary transition-shadow cursor-pointer">
              <Link to="/orders/create">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gradient-primary p-3 rounded-lg">
                      <Plus className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium">Create New Order</h3>
                      <p className="text-sm text-muted-foreground">Start a new shipment</p>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>

            <Card className="shadow-card hover:shadow-primary transition-shadow cursor-pointer">
              <Link to="/reports">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-warning p-3 rounded-lg">
                      <Clock className="h-6 w-6 text-warning-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium">View Reports</h3>
                      <p className="text-sm text-muted-foreground">Analyze performance</p>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;