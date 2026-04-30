import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QrCode, CheckCircle, Calendar, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import Layout from "@/components/layout/Layout";
import api from "@/lib/api";

interface QROrderSearch {
  id: number;
  invoice_number: string;
  status: string;
  note: string;
  searched_at: string;
  searched_by?: number;
}

const CreateOrderQRCodeSubmit = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [orders, setOrders] = useState<QROrderSearch[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<QROrderSearch[]>([]);
  const [dateFilter, setDateFilter] = useState("");
  const [invoiceFilter, setInvoiceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "confirm" | "no-confirm">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [updatedOrder, setUpdatedOrder] = useState<QROrderSearch | null>(null);

  // Get parameters from URL
  const invoiceFromParams = searchParams.get("invoice");
  const statusFromParams = searchParams.get("status");
  const orderIdFromParams = searchParams.get("orderId");

  // Fetch QR order search results from backend
  useEffect(() => {
    const fetchSearchResults = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get("/qr-order-searches/");
        setOrders(response.data);
        setFilteredOrders(response.data);

        // If invoice number is provided in URL, set it as filter
        if (invoiceFromParams) {
          setInvoiceFilter(invoiceFromParams);
        }

        // If status is provided in URL, set the filter and success message
        if (statusFromParams) {
          if (statusFromParams === 'confirm') {
            setStatusFilter('confirm');
            setSuccess(`Invoice #${invoiceFromParams} has been confirmed and saved to search results.`);
          } else if (statusFromParams === 'no-confirm') {
            setStatusFilter('no-confirm');
            setSuccess(`Invoice #${invoiceFromParams} was not found in the system and saved as "No Confirm".`);
          }
        }

        // If searchId is provided, find and highlight the search result
        if (searchParams.get("searchId")) {
          const searchId = searchParams.get("searchId");
          const searchResultData = response.data.find((result: QROrderSearch) =>
            result.id === parseInt(searchId!)
          );
          if (searchResultData) {
            setUpdatedOrder(searchResultData);
          }
        }
      } catch (err: any) {
        console.error("Error fetching QR order search results:", err);
        setError("Failed to load search results. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [invoiceFromParams, statusFromParams, searchParams]);

  // Apply filters
  useEffect(() => {
    let filtered = orders;

    // Apply status filter (Confirm/No Confirm)
    if (statusFilter === 'confirm') {
      filtered = filtered.filter(order => order.status === 'confirmed');
    } else if (statusFilter === 'no-confirm') {
      filtered = filtered.filter(order => order.status === 'no_confirm');
    }

    // Apply invoice filter
    if (invoiceFilter) {
      filtered = filtered.filter(order =>
        order.invoice_number.toLowerCase().includes(invoiceFilter.toLowerCase())
      );
    }

    // Apply date filter
    if (dateFilter) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.searched_at).toISOString().split('T')[0];
        return orderDate === dateFilter;
      });
    }

    setFilteredOrders(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [invoiceFilter, dateFilter, statusFilter, orders]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };


  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground">QR Order Processing</h1>
            <p className="text-muted-foreground">Process scanned QR orders - Confirm matching orders or mark as No Confirm</p>
          </div>
          <Button onClick={() => navigate("/qr-orders/search")}>
            <QrCode className="mr-2 h-4 w-4" />
            Search QR Orders
          </Button>
        </div>

        {/* Success Message */}
        {success && (
          <Card className="shadow-card border-green-500">
            <CardContent className="p-6">
              <Alert variant="default" className="bg-green-100 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-800" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Updated Order Display */}
        {updatedOrder && (
          <Card className="shadow-card border-green-500 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-green-800">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Order Updated Successfully</span>
              </CardTitle>
              <CardDescription className="text-green-700">
                Existing order has been confirmed and updated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-green-700">Invoice Number</Label>
                  <p className="text-lg font-mono font-bold text-green-900">{updatedOrder.invoice_number}</p>
                </div>
                <div>
                  <Label className="text-green-700">Status</Label>
                  <p className="text-lg font-semibold text-green-600">
                    ✓ Confirmed
                  </p>
                </div>
                <div>
                  <Label className="text-green-700">Searched At</Label>
                  <p className="text-sm text-green-800">{new Date(updatedOrder.searched_at).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-green-700">Note</Label>
                  <p className="text-sm text-green-800">{updatedOrder.note || "No note"}</p>
                </div>
              </div>
              <div className="flex justify-center pt-4">
                <Button
                  onClick={() => setUpdatedOrder(null)}
                  variant="outline"
                  className="border-green-500 text-green-600 hover:bg-green-50"
                >
                  View All Orders
                </Button>
              </div>
            </CardContent>
          </Card>
        )}


        {/* Filters */}
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="status-filter">Status Filter</Label>
                <Select value={statusFilter} onValueChange={(value: "all" | "confirm" | "no-confirm") => setStatusFilter(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Orders</SelectItem>
                    <SelectItem value="confirm">Confirmed Orders</SelectItem>
                    <SelectItem value="no-confirm">No Confirm Orders</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="invoice-filter">Invoice Number Filter</Label>
                <Input
                  id="invoice-filter"
                  value={invoiceFilter}
                  onChange={(e) => setInvoiceFilter(e.target.value)}
                  placeholder="Filter by invoice number"
                />
              </div>

              <div>
                <Label htmlFor="date-filter">Date Filter</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="date-filter"
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="shadow-card border-destructive">
            <CardContent className="p-6">
              <div className="text-destructive">{error}</div>
            </CardContent>
          </Card>
        )}

        {/* Orders List */}
        {loading ? (
          <Card className="shadow-card">
            <CardContent className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading QR orders...</p>
            </CardContent>
          </Card>
        ) : filteredOrders.length > 0 ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {currentOrders.map((order) => (
                <Card key={order.id} className="shadow-card hover:shadow-primary transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{order.invoice_number}</CardTitle>
                    <CardDescription>Searched: {new Date(order.searched_at).toLocaleDateString()}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground font-medium">Status:</span>
                      <span className={`text-sm font-medium ${
                        order.status === 'confirmed' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {order.status === 'confirmed' ? '✓ Confirmed' : '✗ No Confirm'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground font-medium">Note:</span>
                      <span className="text-sm">{order.note || "No note"}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Card className="shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length} orders
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
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card className="shadow-card">
            <CardContent className="text-center py-12">
              <QrCode className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No QR orders found</h3>
              <p className="text-muted-foreground mb-4">
                {invoiceFilter || dateFilter ? "Try adjusting your filters." : "No orders available."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default CreateOrderQRCodeSubmit;