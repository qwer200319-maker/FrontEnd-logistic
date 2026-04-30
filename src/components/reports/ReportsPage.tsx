import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Download,
  FileText,
  BarChart3,
  TrendingUp,
  Calendar,
  Package,
  DollarSign,
  Truck,
  AlertCircle,
  CalendarDays,
  Filter,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import api from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { isAdmin, isCustomer } from "@/lib/auth";

interface ReportData {
  period: string;
  totalOrders: number;
  revenue: number;
  deliveredOrders: number;
  pendingOrders: number;
  inTransitOrders: number;
}

interface OrderSummary {
  id: string;
  product_name: string;
  customer: string;
  status: string;
  amount: number;
  shipping_cost?: number;
  shipping_fee?: number;
  date: string;
}

const ReportsPage = () => {
  const [filterPeriod, setFilterPeriod] = useState<"daily" | "monthly" | "yearly">("monthly");
  const [statusFilter, setStatusFilter] = useState<"all" | "delivered" | "in_progress">("all");
  const [reportData, setReportData] = useState<ReportData>({
    period: "",
    totalOrders: 0,
    revenue: 0,
    deliveredOrders: 0,
    pendingOrders: 0,
    inTransitOrders: 0,
  });
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [useCustomDateRange, setUseCustomDateRange] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchReportsData = async () => {
    setLoading(true);
    setError(null);

    // Check if user is authenticated
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please login to access reports");
      navigate("/login");
      return;
    }

    try {
      // Build query parameters
      let statsUrl = `/reports/dashboard_stats/?period=${filterPeriod}`;
      let ordersUrl = `/reports/recent_orders/?period=${filterPeriod}&limit=50`; // Increased limit for pagination

      // Add status filter if not 'all'
      if (statusFilter !== 'all') {
        ordersUrl += `&status=${statusFilter}`;
      }

      // Add custom date range if selected
      if (useCustomDateRange && dateFrom && dateTo) {
        const fromDate = format(dateFrom, 'yyyy-MM-dd');
        const toDate = format(dateTo, 'yyyy-MM-dd');
        statsUrl += `&date_from=${fromDate}&date_to=${toDate}`;
        ordersUrl += `&date_from=${fromDate}&date_to=${toDate}`;
      }

      // Fetch dashboard stats and recent orders
      const [statsResponse, ordersResponse] = await Promise.all([
        api.get(statsUrl),
        api.get(ordersUrl)
      ]);

      // Set report data
      setReportData({
        period: useCustomDateRange && dateFrom && dateTo
          ? `${format(dateFrom, 'MMM dd, yyyy')} - ${format(dateTo, 'MMM dd, yyyy')}`
          : statsResponse.data.period,
        totalOrders: statsResponse.data.total_orders,
        revenue: statsResponse.data.revenue,
        deliveredOrders: statsResponse.data.delivered_orders,
        pendingOrders: statsResponse.data.pending_orders,
        inTransitOrders: statsResponse.data.in_transit_orders,
      });

      // Set orders data
      setOrders(ordersResponse.data);

    } catch (err: any) {
      console.error("Error fetching reports data:", err);
      
      if (err.response?.status === 401) {
        setError("Authentication required. Please login again.");
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError("Failed to load reports data. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch user role for role-based UI logic
  const fetchUserRole = async () => {
    try {
      // Determine user role from local storage
      const userRole = localStorage.getItem("user")
        ? JSON.parse(localStorage.getItem("user") || '{}').role
        : null;

      setUserRole(userRole);
    } catch (err) {
      console.error("Error fetching user role:", err);
    }
  };

  const clearCustomDateRange = () => {
    setUseCustomDateRange(false);
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  // Pagination calculations
  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = orders.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterPeriod, statusFilter, useCustomDateRange, dateFrom, dateTo]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  useEffect(() => {
    fetchReportsData();
    fetchUserRole();
  }, [filterPeriod, statusFilter, useCustomDateRange, dateFrom, dateTo, navigate]);

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

  const exportToCSV = async () => {
    try {
      let apiUrl = `/reports/export_data/?period=${filterPeriod}&type=csv`;
      if (statusFilter !== 'all') {
        apiUrl += `&status=${statusFilter}`;
      }
      if (useCustomDateRange && dateFrom && dateTo) {
        const fromDate = format(dateFrom, 'yyyy-MM-dd');
        const toDate = format(dateTo, 'yyyy-MM-dd');
        apiUrl += `&date_from=${fromDate}&date_to=${toDate}`;
      }
      const response = await api.get(apiUrl, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `orders-report-${filterPeriod}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting CSV:", err);
      setError("Failed to export CSV. Please try again.");
    }
  };

  const exportToPDF = async () => {
    try {
      let apiUrl = `/reports/export_data/?period=${filterPeriod}&type=pdf`;
      if (statusFilter !== 'all') {
        apiUrl += `&status=${statusFilter}`;
      }
      if (useCustomDateRange && dateFrom && dateTo) {
        const fromDate = format(dateFrom, 'yyyy-MM-dd');
        const toDate = format(dateTo, 'yyyy-MM-dd');
        apiUrl += `&date_from=${fromDate}&date_to=${toDate}`;
      }
      const response = await api.get(apiUrl);
      
      // Generate PDF using the data (you can implement jsPDF here)
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.text(`Orders Report - ${reportData.period}`, 20, 20);
      
      // Add summary stats
      doc.setFontSize(12);
      doc.text(`Total Orders: ${reportData.totalOrders}`, 20, 40);
      doc.text(`Revenue: $${(reportData.revenue || 0).toLocaleString()}`, 20, 50);
      doc.text(`Delivered: ${reportData.deliveredOrders}`, 20, 60);
      doc.text(`In Progress: ${reportData.pendingOrders + reportData.inTransitOrders}`, 20, 70);
      
      // Add table headers
      doc.text('Order ID', 20, 90);
      doc.text('Product', 60, 90);
      doc.text('Customer', 100, 90);
      doc.text('Status', 140, 90);
      doc.text('Amount', 170, 90);
      
      // Add order data
      let yPos = 100;
      orders.forEach((order, index) => {
        if (yPos > 270) { // Start new page if needed
          doc.addPage();
          yPos = 20;
        }
        doc.text(order.id, 20, yPos);
        doc.text(order.product_name.substring(0, 15), 60, yPos);
        doc.text(order.customer.substring(0, 15), 100, yPos);
        doc.text(order.status, 140, yPos);
        doc.text(`$${((order.shipping_cost || 0) + (order.shipping_fee || 0)).toFixed(2)}`, 170, yPos);
        yPos += 10;
      });
      
      doc.save(`orders-report-${filterPeriod}.pdf`);
    } catch (err) {
      console.error("Error exporting PDF:", err);
      setError("Failed to export PDF. Please try again.");
    }
  };



  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="ml-4 text-muted-foreground">Loading reports...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
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
            <h1 className="text-3xl font-bold text-foreground">Reports</h1>
            <p className="text-muted-foreground">Analyze your logistics performance</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={exportToPDF}>
              <FileText className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Enhanced Filter with Calendar */}
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Period Filter Row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Quick Filters:</span>
                </div>
                <Select
                  value={useCustomDateRange ? "custom" : filterPeriod}
                  onValueChange={(value) => {
                    if (value === "custom") {
                      setUseCustomDateRange(true);
                    } else {
                      setUseCustomDateRange(false);
                      setFilterPeriod(value as "daily" | "monthly" | "yearly");
                    }
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Today</SelectItem>
                    <SelectItem value="monthly">This Month</SelectItem>
                    <SelectItem value="yearly">This Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>

                {/* Status Filter */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Status:</span>
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => setStatusFilter(value as "all" | "delivered" | "in_progress")}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Orders</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {!useCustomDateRange && (
                  <span className="text-sm text-muted-foreground">
                    Showing data for: <strong>{reportData.period}</strong>
                  </span>
                )}
              </div>

              {/* Custom Date Range Row */}
              {useCustomDateRange && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <CalendarDays className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Custom Date Range:</span>
                  </div>
                  
                  {/* From Date */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-blue-700">From:</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-[240px] justify-start text-left font-normal",
                            !dateFrom && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {dateFrom ? format(dateFrom, "PPP") : "Pick start date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={dateFrom}
                          onSelect={setDateFrom}
                          disabled={(date) =>
                            date > new Date() || (dateTo && date > dateTo)
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* To Date */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-blue-700">To:</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-[240px] justify-start text-left font-normal",
                            !dateTo && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {dateTo ? format(dateTo, "PPP") : "Pick end date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={dateTo}
                          onSelect={setDateTo}
                          disabled={(date) =>
                            date > new Date() || (dateFrom && date < dateFrom)
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Clear Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearCustomDateRange}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </div>
              )}

              {/* Active Filter Display */}
              {useCustomDateRange && dateFrom && dateTo && (
                <div className="flex items-center space-x-2 text-sm">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    <CalendarDays className="h-3 w-3 mr-1" />
                    {format(dateFrom, 'MMM dd, yyyy')} - {format(dateTo, 'MMM dd, yyyy')}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Orders Card - Only shown if user has permission */}
          {reportData.totalOrders !== undefined && (
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(reportData.totalOrders !== undefined ? reportData.totalOrders : 0).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-success flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {reportData.totalOrders > 0
                      ? `+${(
                          ((reportData.totalOrders - (reportData as any).lastPeriodTotalOrders || 0) /
                            ((reportData as any).lastPeriodTotalOrders || 1)) *
                          100
                        ).toFixed(1)}% from last period`
                      : "No previous data"}
                  </span>
                </p>
              </CardContent>
            </Card>
          )}

          {/* Revenue Card - Only shown if user has permission */}
          {reportData.revenue !== undefined && (
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${(reportData.revenue !== undefined ? reportData.revenue : 0).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-success flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {reportData.revenue > 0
                      ? `+${(
                          ((reportData.revenue - (reportData as any).lastPeriodRevenue || 0) /
                            ((reportData as any).lastPeriodRevenue || 1)) *
                          100
                        ).toFixed(1)}% from last period`
                      : "No previous data"}
                  </span>
                </p>
              </CardContent>
            </Card>
          )}

          {/* Delivered Card - Only shown if user has permission */}
          {reportData.deliveredOrders !== undefined && (
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Delivered</CardTitle>
                <Package className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(reportData.deliveredOrders !== undefined ? reportData.deliveredOrders : 0).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {((reportData.deliveredOrders / reportData.totalOrders) * 100).toFixed(1)}% success rate
                </p>
              </CardContent>
            </Card>
          )}

          {/* In Progress Card - Only shown if user has permission */}
          {(reportData.pendingOrders !== undefined || reportData.inTransitOrders !== undefined) && (
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Truck className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {((reportData.pendingOrders !== undefined ? reportData.pendingOrders : 0) + (reportData.inTransitOrders !== undefined ? reportData.inTransitOrders : 0)).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Pending + In Transit
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Orders Table */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Recent Orders ({reportData.period})</span>
            </CardTitle>
            <CardDescription>
              Detailed breakdown of your recent logistics activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr className="text-left">
                    <th className="pb-3 font-medium">Order ID</th>
                    <th className="pb-3 font-medium">Product</th>
                    <th className="pb-3 font-medium">Customer</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium ">Amount</th>
                    <th className="pb-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {currentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-accent transition-colors">
                      <td className="py-4 font-medium">{order.id}</td>
                      <td className="py-4">{order.product_name}</td>
                      <td className="py-4 text-muted-foreground">{order.customer}</td>
                      <td className="py-4">
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="py-4 font-medium">
                        ${((order.shipping_cost || 0) + (order.shipping_fee || 0)).toLocaleString()}
                      </td>
                      <td className="py-4 text-muted-foreground">{order.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {orders.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(endIndex, orders.length)} of {orders.length} orders
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToPage(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {orders.length === 0 && (
              <div className="text-center py-12">
                <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No data available</h3>
                <p className="text-muted-foreground">
                  No orders found for the selected period.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
              <CardDescription>Key metrics for {reportData.period.toLowerCase()}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Delivery Success Rate - Only shown if user has permission */}
              {reportData.deliveredOrders !== undefined && reportData.totalOrders !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Delivery Success Rate</span>
                  <span className="font-medium">
                    {((reportData.deliveredOrders / reportData.totalOrders) * 100).toFixed(1)}%
                  </span>
                </div>
              )}
              {/* Average Order Value - Only shown if user has permission */}
              {reportData.revenue !== undefined && reportData.totalOrders !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Average Order Value</span>
                  <span className="font-medium">
                    ${((reportData.revenue || 0) / (reportData.totalOrders || 1)).toLocaleString()}
                  </span>
                </div>
              )}
              {/* Orders In Transit - Only shown if user has permission */}
              {reportData.inTransitOrders !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Orders In Transit</span>
                  <span className="font-medium">{reportData.inTransitOrders}</span>
                </div>
              )}
              {/* Pending Orders - Only shown if user has permission */}
              {reportData.pendingOrders !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pending Orders</span>
                  <span className="font-medium">{reportData.pendingOrders}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Generate and export detailed reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={exportToCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export Orders to CSV
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={exportToPDF}>
                <FileText className="mr-2 h-4 w-4" />
                Generate PDF Report
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="mr-2 h-4 w-4" />
                Advanced Analytics
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ReportsPage;