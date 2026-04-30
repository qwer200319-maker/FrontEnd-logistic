import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCode, Plus, Calendar, ChevronLeft, ChevronRight, Edit, Trash2, MoreHorizontal, AlertCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Layout from "@/components/layout/Layout";
import api, { getMediaUrl } from "@/lib/api";

interface QROrder {
  id: number;
  invoice_number: string;
  status: string;
  note: string;
  created_at: string;
}

const CreateOrderQRCodeList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<QROrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<QROrder[]>([]);
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingOrders, setDeletingOrders] = useState<Set<number>>(new Set());
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);

  // Fetch orders from backend
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await api.get("/qr-orders/");
        setOrders(response.data);
        setFilteredOrders(response.data);
      } catch (err: any) {
        console.error("Error fetching QR orders:", err);
        setError("Failed to load QR orders. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Apply date filter
  useEffect(() => {
    if (!dateFilter) {
      setFilteredOrders(orders);
      return;
    }

    const filtered = orders.filter(order => {
      const orderDate = new Date(order.created_at).toISOString().split('T')[0];
      return orderDate === dateFilter;
    });
    
    setFilteredOrders(filtered);
    setCurrentPage(1); // Reset to first page when filter changes
  }, [dateFilter, orders]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Handle order editing
  const handleEditOrder = (orderId: number) => {
    navigate(`/qr-orders/edit/${orderId}`);
  };

  // Handle order deletion
  const handleDeleteOrder = async (orderId: number) => {
    setDeletingOrders(prev => new Set(prev).add(orderId));

    try {
      await api.delete(`/qr-orders/${orderId}/`);

      // Remove order from local state
      setOrders(prev => prev.filter(order => order.id !== orderId));
      setDeleteMessage(`QR Order #${orderId} deleted successfully!`);

      // Clear message after 3 seconds
      setTimeout(() => setDeleteMessage(null), 3000);
    } catch (err: any) {
      console.error("Error deleting QR order:", err);
      setDeleteMessage(err.response?.data?.error || 'Failed to delete QR order');

      // Clear error message after 3 seconds
      setTimeout(() => setDeleteMessage(null), 3000);
    } finally {
      setDeletingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground">QR Orders</h1>
            <p className="text-muted-foreground">Manage and track all your QR code shipments</p>
          </div>
          <Link to="/qr-orders/create">
            <Button className="bg-gradient-primary hover:shadow-primary">
              <Plus className="mr-2 h-4 w-4" />
              Create New QR Order
            </Button>
          </Link>
        </div>

        {/* Filter */}
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="pl-10"
                  placeholder="Filter by date"
                />
              </div>
            </div>
          </CardContent>
        </Card>

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

        {/* Delete Message Display */}
        {deleteMessage && (
          <Card className={`shadow-card ${deleteMessage.includes('successfully') ? 'border-green-200' : 'border-red-200'}`}>
            <CardContent className="p-6">
              <div className={`flex items-center space-x-2 ${deleteMessage.includes('successfully') ? 'text-green-800' : 'text-red-800'}`}>
                <span>{deleteMessage}</span>
              </div>
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
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{order.invoice_number}</CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/qr-orders/detail/${order.id}`}>
                              <QrCode className="mr-2 h-4 w-4" />
                              View QR Details
                            </Link>
                          </DropdownMenuItem>
                          {/*   */}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete QR order "${order.invoice_number}"? This action cannot be undone.`)) {
                                handleDeleteOrder(order.id);
                              }
                            }}
                            className="text-red-600 focus:text-red-600"
                            disabled={deletingOrders.has(order.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {deletingOrders.has(order.id) ? 'Deleting...' : 'Delete Order'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardDescription>Created: {new Date(order.created_at).toLocaleDateString()}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground font-medium">Status:</span>
                      <span className="text-sm">{order.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground font-medium">Note:</span>
                      <span className="text-sm">{order.note || "No note"}</span>
                    </div>

                    <div className="flex space-x-2 mt-4">
                      <Link to={`/qr-orders/detail/${order.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <QrCode className="mr-2 h-4 w-4" /> View QR Details
                        </Button>
                      </Link>
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
                {dateFilter ? "Try adjusting your date filter." : "Create your first QR order to get started."}
              </p>
              {!dateFilter && (
                <Link to="/qr-orders/create">
                  <Button className="bg-gradient-primary">
                    <Plus className="mr-2 h-4 w-4" />
                    Create First QR Order
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default CreateOrderQRCodeList;