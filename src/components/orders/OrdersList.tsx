import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Search, Plus, Eye, MoreHorizontal, Truck, CreditCard, AlertCircle, ChevronLeft, ChevronRight, Edit, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Layout from "@/components/layout/Layout";
import api from "@/lib/api";
import { isAdmin, isCustomer } from "@/lib/auth";

interface Order {
  id: number;
  shippingDate: string;
  shippingLocationName: string;
  receiverPhone: string;
  senderPhone: string;
  shippingCost: number;
  shippingFee: number;
  ordered_by: {
    id: number;
    full_name: string;
  };
  ordered_to: {
    id: number;
    full_name: string;
  };
  items?: Array<{
    id: number;
    invoice_number: string;
  }>;
}

interface ApiOrder {
  id: number;
  shipping_date: string;
  shipping_location?: {
    id: number;
    name: string;
  };
  receiver_phone: string;
  sender_phone: string;
  shipping_cost: number;
  shipping_fee: number;
  ordered_by: {
    id: number;
    full_name: string;
  };
  ordered_to: {
    id: number;
    full_name: string;
  };
  items?: Array<{
    id: number;
    invoice_number: string;
  }>;
}



interface User {
  id: number;
  full_name: string;
}

const OrdersList = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [customerFilter, setCustomerFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9); // 3x3 grid
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingOrders, setDeletingOrders] = useState<Set<number>>(new Set());
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      
      // Check if user is authenticated
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login to access orders");
        navigate("/login");
        return;
      }

      try {
        // Fetch orders based on user role
        let ordersRes;
        if (isAdmin()) {
          // Admins can see all orders
          ordersRes = await api.get("shipping-orders/");
        } else {
          // Customers can only see their own orders
          ordersRes = await api.get("shipping-orders/?mine=true");
        }

        // Fetch users (only admins can see all users)
        let usersRes;
        if (isAdmin()) {
          usersRes = await api.get("/users/");
          setUsers(usersRes.data);
        }

        const mappedOrders: Order[] = ordersRes.data.map((order: ApiOrder) => ({
          id: order.id || 0,
          shippingDate: order.shipping_date || "",
          shippingLocationName: order.shipping_location?.name || "Unknown",
          receiverPhone: order.receiver_phone || "N/A",
          senderPhone: order.sender_phone || "N/A",
          shippingCost: Number(order.shipping_cost) || 0,
          shippingFee: Number(order.shipping_fee) || 0,
          ordered_by: order.ordered_by,
          ordered_to: order.ordered_to,
          items: order.items || [],
        }));
        setOrders(mappedOrders);
      } catch (err: any) {
        console.error("Error fetching data:", err);
        
        if (err.response?.status === 401) {
          setError("Authentication required. Please login again.");
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          setTimeout(() => navigate("/login"), 2000);
        } else {
          setError("Failed to load orders. Please try again.");
          setOrders([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [navigate]);

  const filteredOrders = orders.filter((order) => {
    const lowerSearch = searchTerm.toLowerCase();
    const matchesSearch =
      order.id.toString().toLowerCase().includes(lowerSearch) ||
      order.shippingLocationName.toLowerCase().includes(lowerSearch) ||
      order.receiverPhone.toLowerCase().includes(lowerSearch) ||
      order.senderPhone.toLowerCase().includes(lowerSearch) ||
      order.shippingCost.toString().includes(lowerSearch) ||
      order.shippingFee.toString().includes(lowerSearch) ||
      // Search by invoice numbers
      (order.items && order.items.some(item =>
        item.invoice_number && item.invoice_number.toLowerCase().includes(lowerSearch)
      ));

    const matchesCustomer = !customerFilter || order.ordered_by.id.toString() === customerFilter;

    return matchesSearch && matchesCustomer;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, customerFilter]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Handle order deletion
  const handleDeleteOrder = async (orderId: number) => {
    setDeletingOrders(prev => new Set(prev).add(orderId));

    try {
      await api.delete(`/shipping-orders/${orderId}/`);

      // Remove order from local state
      setOrders(prev => prev.filter(order => order.id !== orderId));
      setDeleteMessage(`Order #${orderId} deleted successfully!`);

      // Clear message after 3 seconds
      setTimeout(() => setDeleteMessage(null), 3000);
    } catch (err: any) {
      console.error("Error deleting order:", err);
      setDeleteMessage(err.response?.data?.error || 'Failed to delete order');

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
            <h1 className="text-3xl font-bold text-foreground">Orders</h1>
            <p className="text-muted-foreground">Manage and track all your shipments</p>
          </div>
          <Link to="/orders/create">
            <Button className="bg-gradient-primary hover:shadow-primary">
              <Plus className="mr-2 h-4 w-4" />
              Create Order
            </Button>
          </Link>
        </div>

        {/* Search Input */}
        <Card className="shadow-card">
          <CardContent className="p-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by code, sender phone, receiver phone, location, shipping fee, or invoice number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {isAdmin() && (
              <div className="relative flex-1">
                <Select onValueChange={(value) => setCustomerFilter(value === "all" ? null : value)} value={customerFilter || 'all'}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Customers</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
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
              <p className="mt-4 text-muted-foreground">Loading orders...</p>
            </CardContent>
          </Card>
        ) : filteredOrders.length > 0 ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {currentOrders.map((order) => (
              <Card key={order.id} className="shadow-card hover:shadow-primary transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{order.id}</CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/orders/${order.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/orders/${order.id}?edit=true`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Order
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to={`/invoice/${order.id}`}>
                            <CreditCard className="mr-2 h-4 w-4" />
                            View Invoice
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete order #${order.id}? This action cannot be undone.`)) {
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
                  <CardDescription>{order.shippingLocationName}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground font-medium">Shipping Date:</span>
                    <span className="text-sm">{new Date(order.shippingDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground font-medium">Receiver Phone:</span>
                    <span className="text-sm">{order.receiverPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground font-medium">Sender Phone:</span>
                    <span className="text-sm">{order.senderPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground font-medium">Shipping Cost:</span>
                    <span className="text-sm">${order.shippingCost.toFixed(2)}</span>
                  </div>
                  {order.shippingFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground font-medium">Shipping Fee:</span>
                      <span className="text-sm">${order.shippingFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold mt-1 pt-1 border-t">
                    <span className="text-sm">Total Cost:</span>
                    <span className="text-sm">${(order.shippingCost + order.shippingFee).toFixed(2)}</span>
                  </div>

                  {/* Invoice Numbers */}
                  {order.items && order.items.length > 0 && (
                    <div className="mt-2 pt-2 border-t">
                      <div className="text-xs text-muted-foreground mb-1">Invoice Numbers:</div>
                      <div className="flex flex-wrap gap-1">
                        {order.items.slice(0, 3).map((item, index) => (
                          item.invoice_number && (
                            <span key={item.id} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {item.invoice_number}
                            </span>
                          )
                        ))}
                        {order.items.length > 3 && (
                          <span className="text-xs text-muted-foreground px-2 py-1">
                            +{order.items.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex space-x-2 mt-2">
                    
                    <Link to={`/invoice/${order.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <CreditCard className="mr-2 h-4 w-4" /> Invoice
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
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No orders found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? "Try adjusting your filters or search terms."
                  : "Create your first order to get started."}
              </p>
              {!searchTerm && (
                <Link to="/orders/create">
                  <Button className="bg-gradient-primary">
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Order
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

export default OrdersList;
