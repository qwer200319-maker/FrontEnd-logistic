
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CreditCard,
  Search,
  Filter,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  QrCode,
  Eye,
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
  Truck
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import PaymentQRCode from "./PaymentQRCode";
import QRScanner from "./QRScanner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Layout from "@/components/layout/Layout";
import api from "@/lib/api";
import { isAdmin, isCustomer } from "@/lib/auth";
import { format } from "date-fns";

interface Payment {
  id: number;
  invoice: {
    id: number;
    invoice_number: string;
    shipping_order: {
      id: number;
      shipping_code: string;
      product_name: string;
      ordered_by: {
        id: number;
        full_name: string;
      };
      ordered_to: {
        id: number;
        full_name: string;
      };
      shipping_fee: number;
    };
    billed_to: {
      id: number;
      full_name: string;
      email: string;
    };
    issue_date: string;
    due_date: string;
    payment_date?: string;
    subtotal: number;
    tax_amount: number;
    total_amount: number;
    status: string;
    payment_method?: string;
  };
  amount: number;
  payment_date: string;
  payment_method: string;
  transaction_reference: string;
  created_at: string;
  updated_at: string;
}

interface Invoice {
  id: number;
  invoice_number: string;
  shipping_order: {
    id: number;
    shipping_code: string;
    product_name: string;
    ordered_by: {
      id: number;
      full_name: string;
    };
    ordered_to: {
      id: number;
      full_name: string;
    };
    shipping_fee: number;
  };
  billed_to: {
    id: number;
    full_name: string;
    email: string;
  };
  issue_date: string;
  due_date: string;
  payment_date?: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  payment_method?: string;
}

interface PaymentRecord {
  id: string;
  orderId: string;
  invoiceNumber: string;
  productName: string;
  customer: string;
  amount: number;
  shipping_cost?: number;
  shipping_fee?: number;
  status: "paid" | "unpaid" | "pending";
  paymentMethod?: string;
  date: string;
  dueDate: string;
  invoiceId: number;
}

const PaymentsPage = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [paymentStats, setPaymentStats] = useState({
    totalRevenue: undefined as number | undefined,
    pendingRevenue: undefined as number | undefined,
    paidCount: undefined as number | undefined,
    totalCount: 0, // This one is always available
    successRate: undefined as number | undefined,
    paymentMethods: {} as Record<string, number>,
    totalShippingFee: undefined as number | undefined,
  });
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const navigate = useNavigate();

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    
    // Check if user is authenticated
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please login to access payments");
      navigate("/login");
      return;
    }

    try {
      // Fetch both payments and invoices based on user role
      let paymentsResponse, invoicesResponse, statsResponse;
      if (isAdmin()) {
        // Admins can see all payments and invoices
        [paymentsResponse, invoicesResponse, statsResponse] = await Promise.all([
          api.get<Payment[]>("/payments/"),
          api.get<Invoice[]>("/invoices/"),
          api.get("/payments/payment_stats/").catch(() => ({ data: {} }))
        ]);
      } else {
        // Customers can only see their own payments and invoices
        [paymentsResponse, invoicesResponse, statsResponse] = await Promise.all([
          api.get<Payment[]>("/payments/?mine=true"),
          api.get<Invoice[]>("/invoices/?mine=true"),
          api.get("/payments/payment_stats/").catch(() => ({ data: {} }))
        ]);
      }

      // Create payment records from actual payments
      const paidPaymentRecords: PaymentRecord[] = paymentsResponse.data.map((payment) => ({
        id: `PAY-${payment.id}`,
        orderId: payment.invoice.shipping_order.id.toString(),
        invoiceNumber: payment.invoice.invoice_number,
        productName: payment.invoice.shipping_order.product_name || "N/A",
        customer: payment.invoice.billed_to.full_name,
        amount: Number(payment.amount),
        shipping_cost: payment.invoice.shipping_order.shipping_cost ? Number(payment.invoice.shipping_order.shipping_cost) : 0,
        shipping_fee: payment.invoice.shipping_order.shipping_fee ? Number(payment.invoice.shipping_order.shipping_fee) : 0,
        status: "paid" as const,
        paymentMethod: payment.payment_method,
        date: payment.payment_date,
        dueDate: payment.invoice.due_date,
        invoiceId: payment.invoice.id,
      }));

      // Create payment records for unpaid invoices
      const paidInvoiceIds = new Set(paymentsResponse.data.map(p => p.invoice.id));
      const allInvoices = invoicesResponse.data.filter(invoice => !paidInvoiceIds.has(invoice.id));

      // Separate invoices with status "paid" (should be treated as paid even without payment record)
      const paidStatusInvoices = allInvoices.filter(invoice => invoice.status.toLowerCase() === 'paid');
      const unpaidInvoices = allInvoices.filter(invoice => invoice.status.toLowerCase() !== 'paid');

      // Create payment records for paid status invoices
      const paidStatusPaymentRecords: PaymentRecord[] = paidStatusInvoices.map((invoice) => ({
        id: `INV-${invoice.id}`,
        orderId: invoice.shipping_order.id.toString(),
        invoiceNumber: invoice.invoice_number,
        productName: invoice.shipping_order.product_name || "N/A",
        customer: invoice.billed_to.full_name,
        amount: Number(invoice.total_amount),
        shipping_cost: invoice.shipping_order.shipping_cost ? Number(invoice.shipping_order.shipping_cost) : 0,
        shipping_fee: invoice.shipping_order.shipping_fee ? Number(invoice.shipping_order.shipping_fee) : 0,
        status: "paid" as const,
        paymentMethod: invoice.payment_method || undefined,
        date: invoice.payment_date || invoice.issue_date,
        dueDate: invoice.due_date,
        invoiceId: invoice.id,
      }));

      // Create payment records for unpaid invoices
      const unpaidPaymentRecords: PaymentRecord[] = unpaidInvoices.map((invoice) => ({
        id: `INV-${invoice.id}`,
        orderId: invoice.shipping_order.id.toString(),
        invoiceNumber: invoice.invoice_number,
        productName: invoice.shipping_order.product_name || "N/A",
        customer: invoice.billed_to.full_name,
        amount: Number(invoice.total_amount),
        shipping_cost: invoice.shipping_order.shipping_cost ? Number(invoice.shipping_order.shipping_cost) : 0,
        shipping_fee: invoice.shipping_order.shipping_fee ? Number(invoice.shipping_order.shipping_fee) : 0,
        status: invoice.status.toLowerCase() === "pending" ? "pending" as const : "unpaid" as const,
        paymentMethod: invoice.payment_method || undefined,
        date: invoice.issue_date,
        dueDate: invoice.due_date,
        invoiceId: invoice.id,
      }));

      // Calculate total shipping fee from all invoices
      const totalShippingFee = invoicesResponse.data.reduce((sum, invoice) => {
        let fee = invoice.shipping_order?.shipping_fee;
        console.log(`Invoice ${invoice.invoice_number}:`, {
          shipping_order: invoice.shipping_order,
          shipping_fee: fee,
          shipping_fee_type: typeof fee
        });

        // Handle both number and string values
        if (typeof fee === 'string') {
          fee = parseFloat(fee);
        }

        if (typeof fee === 'number' && !isNaN(fee) && fee > 0) {
          // console.log(`Adding shipping_fee ${fee} to sum`);
          return sum + fee;
        }
        // console.log(`Skipping shipping_fee ${fee} (invalid or zero)`);
        return sum;
      }, 0);
      console.log(`Total Shipping Fee calculated: ${totalShippingFee}`);
      // console.log(`All invoices:`, invoicesResponse.data);

      // Store invoices for calculation display
      setInvoices(invoicesResponse.data);

      // Combine all payment records
      const allPaymentRecords = [...paidPaymentRecords, ...paidStatusPaymentRecords, ...unpaidPaymentRecords];
      setPayments(allPaymentRecords);

      // Set payment stats if available
      if (statsResponse?.data) {
        // Use backend stats if available, otherwise fallback to client-side calculation
        const totalRev = paidPaymentRecords.reduce((sum, p) => sum + (p.shipping_cost || 0) + (p.shipping_fee || 0), 0);
        const pendingRev = allPaymentRecords.filter(p => p.status === "unpaid" || p.status === "pending").reduce((sum, p) => sum + (p.shipping_cost || 0) + (p.shipping_fee || 0), 0);
        const paidCount = allPaymentRecords.filter(p => p.status === "paid").length;

        setPaymentStats({
          totalRevenue: statsResponse.data.total_revenue,
          pendingRevenue: statsResponse.data.pending_revenue,
          paidCount: statsResponse.data.paid_count,
          totalCount: statsResponse.data.total_count || allPaymentRecords.length,
          successRate: statsResponse.data.success_rate,
          paymentMethods: statsResponse.data.payment_methods || {},
          totalShippingFee: statsResponse.data.total_shipping_fee,
        });
      } else {
        // Fallback to client-side calculation if no stats from backend
        const totalRev = paidPaymentRecords.reduce((sum, p) => sum + (p.shipping_cost || 0) + (p.shipping_fee || 0), 0);
        const pendingRev = allPaymentRecords.filter(p => p.status === "unpaid" || p.status === "pending").reduce((sum, p) => sum + (p.shipping_cost || 0) + (p.shipping_fee || 0), 0);
        const paidCount = allPaymentRecords.filter(p => p.status === "paid").length;

        setPaymentStats({
          totalRevenue: undefined,
          pendingRevenue: undefined,
          paidCount: undefined,
          totalCount: allPaymentRecords.length,
          successRate: undefined,
          paymentMethods: {},
          totalShippingFee: undefined,
        });
      }

    } catch (err: any) {
      console.error("Error fetching payments:", err);
      
      if (err.response?.status === 401) {
        setError("Authentication required. Please login again.");
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError("Failed to load payments. Please try again.");
        setPayments([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [navigate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-success text-success-foreground";
      case "pending":
        return "bg-warning text-warning-foreground";
      case "unpaid":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "unpaid":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.orderId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;

    // Date filtering logic
    let matchesDate = true;
    if (startDate || endDate) {
      const paymentDate = new Date(payment.date);
      if (startDate && paymentDate < startDate) {
        matchesDate = false;
      }
      if (endDate && paymentDate > endDate) {
        matchesDate = false;
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPayments = filteredPayments.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, startDate, endDate]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Calculate filtered stats based on date range
  const filteredStats = React.useMemo(() => {
    if (!startDate && !endDate) {
      // Return original stats if no date filter
      return {
        totalRevenue: paymentStats.totalRevenue,
        pendingRevenue: paymentStats.pendingRevenue,
        paidCount: paymentStats.paidCount,
        unpaidCount: paymentStats.paidCount !== undefined ? paymentStats.totalCount - paymentStats.paidCount : 0,
        successRate: paymentStats.successRate,
        totalShippingFee: paymentStats.totalShippingFee,
        totalCount: paymentStats.totalCount,
      };
    }

    // Filter payments by date range
    const dateFilteredPayments = payments.filter(payment => {
      const paymentDate = new Date(payment.date);
      if (startDate && paymentDate < startDate) return false;
      if (endDate && paymentDate > endDate) return false;
      return true;
    });

    // Calculate stats from filtered payments
    const paidPayments = dateFilteredPayments.filter(p => p.status === "paid");
    const unpaidPayments = dateFilteredPayments.filter(p => p.status === "unpaid" || p.status === "pending");

    const totalRev = paidPayments.reduce((sum, p) => sum + (p.shipping_cost || 0) + (p.shipping_fee || 0), 0);
    const pendingRev = unpaidPayments.reduce((sum, p) => sum + (p.shipping_cost || 0) + (p.shipping_fee || 0), 0);
    const paidCnt = paidPayments.length;
    const totalCnt = dateFilteredPayments.length;
    const successRt = totalCnt > 0 ? (paidCnt / totalCnt) * 100 : 0;

    // Calculate filtered shipping fee
    const filteredShippingFee = invoices
      .filter(invoice => {
        const invoiceDate = new Date(invoice.issue_date);
        if (startDate && invoiceDate < startDate) return false;
        if (endDate && invoiceDate > endDate) return false;
        return true;
      })
      .reduce((sum, invoice) => {
        let fee = invoice.shipping_order?.shipping_fee;
        if (typeof fee === 'string') {
          fee = parseFloat(fee);
        }
        if (typeof fee === 'number' && !isNaN(fee) && fee > 0) {
          return sum + fee;
        }
        return sum;
      }, 0);

    return {
      totalRevenue: totalRev,
      pendingRevenue: pendingRev,
      paidCount: paidCnt,
      unpaidCount: totalCnt - paidCnt,
      successRate: successRt,
      totalShippingFee: filteredShippingFee,
      totalCount: totalCnt,
    };
  }, [payments, invoices, startDate, endDate, paymentStats]);

  const totalRevenue = filteredStats.totalRevenue;
  const pendingRevenue = filteredStats.pendingRevenue;
  const paidCount = filteredStats.paidCount;
  const unpaidCount = filteredStats.unpaidCount;
  const successRate = filteredStats.successRate;
  const totalShippingFee = filteredStats.totalShippingFee;

  const handlePaymentComplete = async () => {
    if (selectedPayment) {
      try {
        // Extract invoice ID from payment ID (PAY-{invoiceId})
        const invoiceId = selectedPayment.id.replace('PAY-', '');
        await api.post(`/invoices/${invoiceId}/mark_as_paid/`);
        
        // Refresh payments data
        await fetchPayments();
        setSelectedPayment(null);
      } catch (err: any) {
        console.error("Error marking payment as paid:", err);
        setError("Failed to process payment. Please try again.");
      }
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="ml-4 text-muted-foreground">Loading payments...</p>
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
            <h1 className="text-3xl font-bold text-foreground">Payments</h1>
            <p className="text-muted-foreground">Manage and track all payment transactions</p>
         </div>
       </div>

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

       {/* Stats Grid */}
       {isAdmin() ? (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {/* Total Revenue Card */}
           <Card className="shadow-card">
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
               <DollarSign className="h-4 w-4 text-success" />
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold text-success">${(totalRevenue !== undefined ? totalRevenue : 0).toLocaleString()}</div>
               <p className="text-xs text-muted-foreground">From {paidCount !== undefined ? paidCount : 0} paid orders</p>
             </CardContent>
           </Card>

           {/* Pending Revenue Card */}
           <Card className="shadow-card">
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-sm font-medium">Pending Revenue</CardTitle>
               <AlertCircle className="h-4 w-4 text-destructive" />
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold text-destructive">${(pendingRevenue !== undefined ? pendingRevenue : 0).toLocaleString()}</div>
               <p className="text-xs text-muted-foreground">From {unpaidCount !== undefined ? unpaidCount : 0} unpaid orders</p>
             </CardContent>
           </Card>

           {/* Payment Success Rate Card */}
           <Card className="shadow-card">
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-sm font-medium">Payment Success Rate</CardTitle>
               <CheckCircle className="h-4 w-4 text-success" />
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold">
                 {(successRate !== undefined ? successRate : 0).toFixed(1)}%
               </div>
               <p className="text-xs text-muted-foreground">
                 {paidCount !== undefined ? paidCount : 0} of {paymentStats.totalCount} orders paid
               </p>
             </CardContent>
           </Card>

           {/* Total Shipping Fee Card */}
           <Card className="shadow-card">
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-sm font-medium">Total Shipping Fee</CardTitle>
               <Truck className="h-4 w-4 text-primary" />
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold">
                ${(totalShippingFee !== undefined ? totalShippingFee : 0).toLocaleString()}
               </div>
               <p className="text-xs text-muted-foreground">
                {startDate || endDate
                  ? `Shipping fees from ${filteredStats.totalCount !== undefined ? filteredStats.totalCount : 0} filtered records`
                  : `Total shipping fees from ${invoices.length} invoices`
                }
               </p>
             </CardContent>
           </Card>
         </div>
       ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {/* Your Payments Card - Always shown */}
           {paymentStats.paidCount !== undefined && (
            <Card className="shadow-card">
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-sm font-medium">Your Payments</CardTitle>
               <CreditCard className="h-4 w-4 text-primary" />
             </CardHeader>
             <CardContent>
               {/* <div className="text-2xl font-bold text-success">
                   ${(paidCount !== undefined ? paidCount : 0).toLocaleString()}
               </div> */}
               <div className="text-2xl font-bold">{paymentStats.totalCount}</div>
               <p className="text-xs text-muted-foreground">Total payment records</p>
             </CardContent>
           </Card>)}

           {/* Amount Paid Card - Only shown if user has permission */}
           {paymentStats.totalRevenue !== undefined && (
             <Card className="shadow-card">
               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                 <CardTitle className="text-sm font-medium">Amount Paid</CardTitle>
                 <CheckCircle className="h-4 w-4 text-success" />
               </CardHeader>
               <CardContent>
                 <div className="text-2xl font-bold text-success">
                   ${(totalRevenue !== undefined ? totalRevenue : 0).toLocaleString()}
                 </div>
                 <p className="text-xs text-muted-foreground">
                   From {payments.filter(p => p.status === "paid").length} paid orders
                 </p>
               </CardContent>
             </Card>
           )}

           {/* Amount Due Card - Only shown if user has permission */}
           {paymentStats.pendingRevenue !== undefined && (
             <Card className="shadow-card">
               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                 <CardTitle className="text-sm font-medium">Amount Due</CardTitle>
                 <AlertCircle className="h-4 w-4 text-destructive" />
               </CardHeader>
               <CardContent>
                 <div className="text-2xl font-bold text-destructive">
                   ${(pendingRevenue !== undefined ? pendingRevenue : 0).toLocaleString()}
                 </div>
                 <p className="text-xs text-muted-foreground">
                   From {payments.filter(p => p.status === "unpaid").length} unpaid orders
                 </p>
               </CardContent>
             </Card>
           )}

           {/* Payment Success Rate Card - Only shown if user has permission */}
           {paymentStats.successRate !== undefined && (
             <Card className="shadow-card">
               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                 <CardTitle className="text-sm font-medium">Payment Success Rate</CardTitle>
                 <QrCode className="h-4 w-4 text-primary" />
               </CardHeader>
               <CardContent>
                 <div className="text-2xl font-bold">
                   {(successRate !== undefined ? successRate : 0).toFixed(1)}%
                 </div>
                 <p className="text-xs text-muted-foreground">
                   {paidCount !== undefined ? paidCount : 0} of {paymentStats.totalCount} orders paid
                 </p>
               </CardContent>
             </Card>
           )}
         </div>
       )}
       
        {/* Enhanced Filter with Calendar */}
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex gap-2">
                  <Button
                    variant={statusFilter === "all" ? "default" : "outline"}
                    onClick={() => setStatusFilter("all")}
                    size="sm"
                  >
                    All
                  </Button>
                  <Button
                    variant={statusFilter === "paid" ? "success" : "outline"}
                    onClick={() => setStatusFilter("paid")}
                    size="sm"
                  >
                    Paid
                  </Button>
                  <Button
                    variant={statusFilter === "unpaid" ? "destructive" : "outline"}
                    onClick={() => setStatusFilter("unpaid")}
                    size="sm"
                  >
                    Unpaid
                  </Button>
                  {/* <Button
                    variant={statusFilter === "pending" ? "outline" : "outline"}
                    onClick={() => setStatusFilter("pending")}
                    size="sm"
                  >
                    Pending
                  </Button> */}
                </div>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-[140px] justify-start text-left font-normal ${!startDate && "text-muted-foreground"}`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-[140px] justify-start text-left font-normal ${!endDate && "text-muted-foreground"}`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "End date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {(startDate || endDate) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setStartDate(undefined);
                        setEndDate(undefined);
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payments List */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Payment Records</span>
            </CardTitle>
            <CardDescription>
              View and manage all payment transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr className="text-left">
                    <th className="pb-3 font-medium">Payment ID</th>
                    <th className="pb-3 font-medium">Order</th>
                    {isAdmin() && (
                      <th className="pb-3 font-medium">Customer</th>
                    )}
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium ">Amount</th>
                    <th className="pb-3 font-medium">Method</th>
                    <th className="pb-3 font-medium">Due Date</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {currentPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-accent transition-colors">
                      <td className="py-4 font-medium">{payment.invoiceNumber}</td>
                      <td className="py-4">
                        <div>
                          <p className="font-medium text-sm">Order #{payment.orderId}</p>
                          <p className="text-xs text-muted-foreground">{payment.productName}</p>
                        </div>
                      </td>
                      {isAdmin() && (
                        <td className="py-4 text-muted-foreground">{payment.customer}</td>
                      )}
                      <td className="py-4">
                        <Badge className={getStatusColor(payment.status)}>
                          <span className="flex items-center space-x-1">
                            {getStatusIcon(payment.status)}
                            <span>{payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}</span>
                          </span>
                        </Badge>
                      </td>
                      <td className="py-4  font-medium">
                        ${((payment.shipping_cost || 0) + (payment.shipping_fee || 0)).toLocaleString()}
                      </td>
                      <td className="py-4 text-muted-foreground">
                        {payment.paymentMethod || "Not specified"}
                      </td>
                      <td className="py-4 text-muted-foreground">{payment.dueDate}</td>
                      <td className="py-4">
                        <div className="flex space-x-2">
                          <Link to={`/invoice/${payment.orderId}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="mr-1 h-3 w-3" />
                              Invoice
                            </Button>
                          </Link>
                          {/* {payment.status === "unpaid" && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="premium"
                                  size="sm"
                                  onClick={() => setSelectedPayment(payment)}
                                >
                                  <QrCode className="mr-1 h-3 w-3" />
                                  Pay
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Payment for {payment.orderId}</DialogTitle>
                                  <DialogDescription>
                                    Complete payment using QR code
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedPayment && (
                                  <PaymentQRCode
                                    orderId={selectedPayment.orderId}
                                    amount={(selectedPayment.shipping_cost || 0) + (selectedPayment.shipping_fee || 0)}
                                    paymentStatus={selectedPayment.status}
                                    onPaymentComplete={handlePaymentComplete}
                                  />
                                )}
                              </DialogContent>
                            </Dialog>
                          )}
                          {payment.status === "unpaid" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedPayment(payment);
                                setIsScannerOpen(true);
                              }}
                            >
                              <QrCode className="mr-1 h-3 w-3" />
                              Scan
                            </Button>
                          )} */}
                        </div>
                      </td>
                    </tr>
                  ))}
                  <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Scan Payment QR Code</DialogTitle>
                        <DialogDescription>
                          Scan a payment QR code to process the payment
                        </DialogDescription>
                      </DialogHeader>
                      {selectedPayment && (
                        <QRScanner
                          onScanSuccess={(data) => {
                            try {
                              const parsedData = JSON.parse(data);
                              // Verify that the scanned QR code matches the selected payment
                              if (parsedData.orderId === selectedPayment.orderId) {
                                handlePaymentComplete();
                              } else {
                                setError("Scanned QR code does not match the selected payment.");
                              }
                            } catch (err) {
                              setError("Invalid QR code format.");
                            }
                            setIsScannerOpen(false);
                          }}
                          onScanError={(error) => {
                            setError(error);
                            setIsScannerOpen(false);
                          }}
                        />
                      )}
                    </DialogContent>
                  </Dialog>
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredPayments.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredPayments.length)} of {filteredPayments.length} payments
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

            {filteredPayments.length === 0 && (
              <div className="text-center py-12">
                <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No payments found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your filters or search terms."
                    : "No payment records available."
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PaymentsPage;