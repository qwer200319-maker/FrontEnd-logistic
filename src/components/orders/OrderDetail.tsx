import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import api from '@/lib/api';
import {
  Truck,
  Package,
  User,
  Phone,
  MapPin,
  Calendar,
  FileText,
  ChevronRight,
  Edit,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import Layout from '../layout/Layout';

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  weight_kg: number | null;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  unit: string;
  invoice_number: string;
}

interface Order {
  id: number;
  shipping_code: string;
  ordered_by: {
    full_name: string;
  };
  ordered_to: {
    full_name: string;
  };
  delivery_address: string;
  sender_phone: string;
  receiver_phone: string;
  status: string;
  shipping_cost: number | null;
  shipping_fee: number | null;
  calculation_type: string;
  total_value: number | null;
  total_weight_kg: number | null;
  total_weight_ton: number | null;
  total_cbm: number | null;

  created_at: string;
  shipping_date: string;
  shipping_location: {
    name: string;
  };
  items: OrderItem[];
}



const OrderDetail: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [statusUpdateMessage, setStatusUpdateMessage] = useState<string | null>(null);
  const [editingShipping, setEditingShipping] = useState<boolean>(false);
  const [shippingCost, setShippingCost] = useState<string>("");
  const [shippingFee, setShippingFee] = useState<string>("");
  const [updatingShipping, setUpdatingShipping] = useState<boolean>(false);
  const [shippingUpdateMessage, setShippingUpdateMessage] = useState<string | null>(null);

  // Edit and Delete states
  const [editingOrder, setEditingOrder] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState({
    delivery_address: '',
    sender_phone: '',
    receiver_phone: '',
    note: ''
  });
  const [updatingOrder, setUpdatingOrder] = useState<boolean>(false);
  const [orderUpdateMessage, setOrderUpdateMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [deletingOrder, setDeletingOrder] = useState<boolean>(false);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await api.get(`/shipping-orders/${orderId}/`);
        setOrder(response.data);
        // Initialize shipping cost and fee values for editing
        setShippingCost(response.data.shipping_cost !== null ? parseFloat(response.data.shipping_cost.toString()).toString() : "");
        setShippingFee(response.data.shipping_fee !== null ? parseFloat(response.data.shipping_fee.toString()).toString() : "");

        // Initialize edit form data
        setEditFormData({
          delivery_address: response.data.delivery_address || '',
          sender_phone: response.data.sender_phone || '',
          receiver_phone: response.data.receiver_phone || '',
          note: response.data.note || ''
        });
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError("Order not found.");
        } else {
          setError("Failed to fetch order details.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleShippingUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    setUpdatingShipping(true);
    setShippingUpdateMessage(null);

    try {
      const payload: { shipping_cost?: number | null; shipping_fee?: number | null } = {};
      
      // Only include fields that have changed
      const currentShippingCost = order.shipping_cost !== null ? parseFloat(order.shipping_cost.toString()) : null;
      const currentShippingFee = order.shipping_fee !== null ? parseFloat(order.shipping_fee.toString()) : null;
      
      if (shippingCost === "" && currentShippingCost !== null) {
        payload.shipping_cost = null;
      } else if (shippingCost !== "") {
        const newShippingCost = parseFloat(shippingCost);
        if (!isNaN(newShippingCost) && newShippingCost !== currentShippingCost) {
          payload.shipping_cost = newShippingCost;
        }
      }
      
      if (shippingFee === "" && currentShippingFee !== null) {
        payload.shipping_fee = null;
      } else if (shippingFee !== "") {
        const newShippingFee = parseFloat(shippingFee);
        if (!isNaN(newShippingFee) && newShippingFee !== currentShippingFee) {
          payload.shipping_fee = newShippingFee;
        }
      }

      // If no changes, don't make API call
      if (Object.keys(payload).length === 0) {
        setShippingUpdateMessage("No changes to update");
        setTimeout(() => setShippingUpdateMessage(null), 3000);
        setUpdatingShipping(false);
        setEditingShipping(false);
        return;
      }

      const response = await api.patch(`/shipping-orders/${order.id}/`, payload);

      setOrder(prev => prev ? { ...prev, ...response.data } : null);
      setShippingUpdateMessage('Shipping cost/fee updated successfully!');
      setTimeout(() => setShippingUpdateMessage(null), 3000);
      setEditingShipping(false);
    } catch (err: any) {
      if (err.response) {
        setShippingUpdateMessage(err.response.data.error || 'Failed to update shipping cost/fee');
      } else {
        setShippingUpdateMessage('Failed to update shipping cost/fee');
      }
      setTimeout(() => setShippingUpdateMessage(null), 3000);
    } finally {
      setUpdatingShipping(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return;

    setUpdatingStatus(true);
    setStatusUpdateMessage(null);

    try {
      const response = await api.patch('/shipping-orders/update_status/', {
        id: order.id,
        status: newStatus,
        notes: `Status updated to ${newStatus}`
      });

      setOrder(prev => prev ? { ...prev, status: newStatus } : null);
      setStatusUpdateMessage('Status updated successfully!');
      setTimeout(() => setStatusUpdateMessage(null), 3000);
    } catch (err: any) {
      if (err.response) {
        setStatusUpdateMessage(err.response.data.error || 'Failed to update status');
      } else {
        setStatusUpdateMessage('Failed to update status');
      }
      setTimeout(() => setStatusUpdateMessage(null), 3000);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle order update
  const handleOrderUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    setUpdatingOrder(true);
    setOrderUpdateMessage(null);

    try {
      const payload: any = {};

      // Check which fields have changed
      if (editFormData.delivery_address !== order.delivery_address) {
        payload.delivery_address = editFormData.delivery_address;
      }
      if (editFormData.sender_phone !== order.sender_phone) {
        payload.sender_phone = editFormData.sender_phone;
      }
      if (editFormData.receiver_phone !== order.receiver_phone) {
        payload.receiver_phone = editFormData.receiver_phone;
      }
      if (editFormData.note !== (order as any).note) {
        payload.note = editFormData.note;
      }

      // If no changes, don't make API call
      if (Object.keys(payload).length === 0) {
        setOrderUpdateMessage("No changes to update");
        setTimeout(() => setOrderUpdateMessage(null), 3000);
        setUpdatingOrder(false);
        setEditingOrder(false);
        return;
      }

      const response = await api.patch(`/shipping-orders/${order.id}/`, payload);

      setOrder(prev => prev ? { ...prev, ...response.data } : null);
      setOrderUpdateMessage('Order updated successfully!');
      setTimeout(() => setOrderUpdateMessage(null), 3000);
      setEditingOrder(false);
    } catch (err: any) {
      if (err.response) {
        setOrderUpdateMessage(err.response.data.error || 'Failed to update order');
      } else {
        setOrderUpdateMessage('Failed to update order');
      }
      setTimeout(() => setOrderUpdateMessage(null), 3000);
    } finally {
      setUpdatingOrder(false);
    }
  };

  // Handle order deletion
  const handleOrderDelete = async () => {
    if (!order) return;

    setDeletingOrder(true);
    setDeleteMessage(null);

    try {
      await api.delete(`/shipping-orders/${order.id}/`);

      setDeleteMessage('Order deleted successfully!');
      setTimeout(() => {
        setDeleteMessage(null);
        // Navigate back to orders list after successful deletion
        window.location.href = '/orders';
      }, 2000);
    } catch (err: any) {
      if (err.response) {
        setDeleteMessage(err.response.data.error || 'Failed to delete order');
      } else {
        setDeleteMessage('Failed to delete order');
      }
      setTimeout(() => setDeleteMessage(null), 3000);
    } finally {
      setDeletingOrder(false);
      setShowDeleteConfirm(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'confirmed': return 'default';
      case 'in_transit': return 'outline';
      case 'delivered': return 'default';
      case 'cancelled': return 'destructive';
      case 'returned': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusDisplayName = (status: string) => {
    return status.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return <Layout><div>Loading...</div></Layout>;
  }

  if (error) {
    return <Layout><div>{error}</div></Layout>;
  }

  if (!order) {
    return <Layout><div>Order not found.</div></Layout>;
  }

  
  // Convert item total to the specified unit
  const convertToUnit = (value: number, fromUnit: string, toUnit: string): number => {
    // If same unit, no conversion needed
    if (fromUnit === toUnit) return value;
    
    // Conversion factors
    const KG_TO_TON = 0.001;
    const TON_TO_KG = 1000;
    const CBM_TO_KG = 167; // Standard conversion factor in logistics
    const KG_TO_CBM = 1 / CBM_TO_KG;
    
    // Convert to target unit
    switch (fromUnit) {
      case "kg":
        if (toUnit === "ton") return value * KG_TO_TON;
        if (toUnit === "cbm") return value * KG_TO_CBM;
        break;
      case "ton":
        if (toUnit === "kg") return value * TON_TO_KG;
        if (toUnit === "cbm") return (value * TON_TO_KG) * KG_TO_CBM;
        break;
      case "cbm":
        if (toUnit === "kg") return value * CBM_TO_KG;
        if (toUnit === "ton") return (value * CBM_TO_KG) * KG_TO_TON;
        break;
    }
    
    return value; // fallback
  };
  
  // Calculate item total based on item's unit
  const calculateItemTotal = (item: OrderItem): number => {
    if (item.unit === "kg" || item.unit === "ton") {
      if (item.weight_kg !== null && item.quantity > 0) {
        const totalKg = item.weight_kg * item.quantity;
        return item.unit === "ton" ? totalKg / 1000 : totalKg;
      }
      return 0;
    } else {
      // CBM calculation
      if (item.length_cm !== null && item.width_cm !== null && item.height_cm !== null && item.quantity > 0) {
        return (item.length_cm * item.width_cm * item.height_cm * item.quantity) / 1000000;
      }
      return 0;
    }
  };
  
  // Calculate grand total in the selected calculation unit
  const calculateGrandTotal = (): number => {
    if (!order) return 0;
    
    return order.items.reduce((sum, item) => {
      const itemTotal = calculateItemTotal(item);
      const convertedTotal = convertToUnit(itemTotal, item.unit, order.calculation_type);
      return sum + convertedTotal;
    }, 0);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Order Details</h1>
            <p className="text-muted-foreground">Details for order #{order.shipping_code}</p>
            <div className="flex items-center space-x-2 mt-2">
              <span className="text-sm font-medium">Status:</span>
              <Badge variant={getStatusBadgeVariant(order.status)}>
                {getStatusDisplayName(order.status)}
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 space-x-2">
            <Link to={`/invoice/${order.id}`}>
              <Button variant="outline"><FileText className="mr-2 h-4 w-4" />View Invoice</Button>
            </Link>
            <Button
              onClick={() => setEditingOrder(true)}
              variant="outline"
            >
              <Edit className="mr-2 h-4 w-4" />Edit Order
            </Button>
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              variant="destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />Delete Order
            </Button>
          </div>
        </div>

        {statusUpdateMessage && (
          <div className={`p-4 rounded-md ${statusUpdateMessage.includes('successfully') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {statusUpdateMessage}
          </div>
        )}

        <div className="grid gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
              </CardHeader>
              <CardContent>
                {order.items && order.items.length > 0 ? (
                  <div className="space-y-4">
                    <Card className="shadow-sm rounded-lg overflow-hidden">
                      <CardContent className="p-0">
                        <h3 className="font-medium text-sm p-4 border-b">Product Information</h3>
                        <div className="divide-y divide-gray-100">
                          {order.items.map((item, index) => (
                            <div key={item.id} className="p-4">
                              <div className="flex gap-4">
                                {/* Thumbnail placeholder - in a real app this would be an actual image */}
                                <div className="flex-shrink-0 w-12 h-12 rounded bg-gray-200 border border-gray-300 flex items-center justify-center">
                                  <Package className="w-6 h-6 text-gray-400" />
                                </div>
                                
                                {/* Product details */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-start justify-between gap-2">
                                    <h4 className="font-medium text-sm truncate">{item.product_name || `Item ${index + 1}`}</h4>
                                    {/* <span className="font-medium text-sm text-foreground">
                                      {item.unit === "kg" || item.unit === "ton"
                                        ? (item.weight_kg !== null ? (item.weight_kg * item.quantity).toFixed(item.unit === "ton" ? 6 : 3) : "0")
                                        : (item.length_cm !== null && item.width_cm !== null && item.height_cm !== null
                                            ? ((item.length_cm * item.width_cm * item.height_cm * item.quantity) / 1000000).toFixed(6)
                                            : "0")
                                      } {item.unit === "ton" ? "Ton" : item.unit === "cbm" ? "CBM" : "Kg"}
                                    </span> */}
                                  </div>
                                  
                                  <div className="mt-1 flex flex-wrap gap-2">
                                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                      Qty: {item.quantity}
                                    </span>
                                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                      Unit: {item.unit}
                                    </span>

                                    {/* Invoice Number */}
                                    {item.invoice_number && (
                                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                        Invoice: {item.invoice_number}
                                      </span>
                                    )}

                                    {/* Optional attributes as badges */}
                                    {/* {item.weight_kg !== null && (
                                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                        Weight: {item.weight_kg} kg
                                      </span>
                                    )} */}

                                    {/* {item.length_cm !== null && item.width_cm !== null && item.height_cm !== null && (
                                      <>
                                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                          L: {item.length_cm} cm
                                        </span>
                                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                          W: {item.width_cm} cm
                                        </span>
                                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                          H: {item.height_cm} cm
                                        </span>
                                      </>
                                    )} */}
                                  </div>
                                  
                                  {/* Optional note - in a real app this would come from item data */}
                                  {/* <p className="mt-2 text-xs text-muted-foreground">Note: Special handling required</p> */}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Grand Total */}
                        <div className="p-4 bg-gray-50 border-t">
                          
                            <div className="flex justify-between items-center pt-2 border-gray-200">
                              <span className="font-medium text-sm">Total Value</span>
                              <span className="font-bold text-base">
                                {order.total_value.toFixed(3)} {order.calculation_type === "kg" ? "Kg" : order.calculation_type === "ton" ? "Ton" : "CBM"}
                              </span>
                            </div>
                          
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No items found for this order.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-3 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Sender</p>
                      <p className="text-sm text-muted-foreground">{order.ordered_by.full_name}</p>
                    </div>
                  </div>
                  <div>
                    <Select
                      value={order.status}
                      onValueChange={handleStatusUpdate}
                      disabled={updatingStatus}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="in_transit">In Transit</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="returned">Returned</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center">
                  <User className="h-5 w-5 mr-3 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Receiver</p>
                    <p className="text-sm text-muted-foreground">{order.ordered_to.full_name}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center">
                  <Phone className="h-5 w-5 mr-3 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Sender Phone</p>
                    <p className="text-sm text-muted-foreground">{order.sender_phone}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center">
                  <Phone className="h-5 w-5 mr-3 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Receiver Phone</p>
                    <p className="text-sm text-muted-foreground">{order.receiver_phone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shipping Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-3 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Shipping Location</p>
                    <p className="text-sm text-muted-foreground">{order.shipping_location.name}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-3 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Delivery Address</p>
                    <p className="text-sm text-muted-foreground">{order.delivery_address}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-3 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Shipping Date</p>
                    <p className="text-sm text-muted-foreground">{new Date(order.shipping_date).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shipping Cost & Fee</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {shippingUpdateMessage && (
                  <div className={`p-2 rounded ${shippingUpdateMessage.includes('successfully') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {shippingUpdateMessage}
                  </div>
                )}
                
                {editingShipping ? (
                  <form onSubmit={handleShippingUpdate} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Shipping Cost</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={shippingCost}
                        onChange={(e) => setShippingCost(e.target.value)}
                        placeholder="Enter shipping cost"
                        className="w-full rounded-md border px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Shipping Fee</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={shippingFee}
                        onChange={(e) => setShippingFee(e.target.value)}
                        placeholder="Enter shipping fee"
                        className="w-full rounded-md border px-3 py-2"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button type="submit" disabled={updatingShipping}>
                        {updatingShipping ? "Updating..." : "Save"}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setEditingShipping(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">Shipping Cost</p>
                        <p className="text-sm text-muted-foreground">
                          {order.shipping_cost !== null ? `$${parseFloat(order.shipping_cost.toString()).toFixed(2)}` : "Not set"}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setEditingShipping(true)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">Shipping Fee</p>
                        <p className="text-sm text-muted-foreground">
                          {order.shipping_fee !== null ? `$${parseFloat(order.shipping_fee.toString()).toFixed(2)}` : "Not set"}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setEditingShipping(true)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
        </div>

        {/* Edit Order Form */}
        {editingOrder && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Edit Order Details</CardTitle>
              <CardDescription>
                Update order information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {orderUpdateMessage && (
                <div className={`p-4 rounded-md mb-4 ${orderUpdateMessage.includes('successfully') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                  {orderUpdateMessage}
                </div>
              )}

              <form onSubmit={handleOrderUpdate} className="space-y-4">
                <div>
                  <Label htmlFor="delivery_address">Delivery Address</Label>
                  <textarea
                    id="delivery_address"
                    value={editFormData.delivery_address}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, delivery_address: e.target.value }))}
                    className="w-full rounded-md border px-3 py-2 mt-1"
                    rows={3}
                    placeholder="Enter delivery address"
                  />
                </div>

                <div>
                  <Label htmlFor="sender_phone">Sender Phone</Label>
                  <input
                    type="tel"
                    id="sender_phone"
                    value={editFormData.sender_phone}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, sender_phone: e.target.value }))}
                    className="w-full rounded-md border px-3 py-2 mt-1"
                    placeholder="Enter sender phone number"
                  />
                </div>

                <div>
                  <Label htmlFor="receiver_phone">Receiver Phone</Label>
                  <input
                    type="tel"
                    id="receiver_phone"
                    value={editFormData.receiver_phone}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, receiver_phone: e.target.value }))}
                    className="w-full rounded-md border px-3 py-2 mt-1"
                    placeholder="Enter receiver phone number"
                  />
                </div>

                <div>
                  <Label htmlFor="note">Note</Label>
                  <textarea
                    id="note"
                    value={editFormData.note}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, note: e.target.value }))}
                    className="w-full rounded-md border px-3 py-2 mt-1"
                    rows={3}
                    placeholder="Add any additional notes"
                  />
                </div>

                <div className="flex space-x-2">
                  <Button type="submit" disabled={updatingOrder}>
                    {updatingOrder ? "Updating..." : "Update Order"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setEditingOrder(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <Card className="mt-6 border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <AlertTriangle className="mr-2 h-5 w-5" />
                Confirm Deletion
              </CardTitle>
              <CardDescription>
                This action cannot be undone. This will permanently delete the order and all associated data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deleteMessage && (
                <div className={`p-4 rounded-md mb-4 ${deleteMessage.includes('successfully') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                  {deleteMessage}
                </div>
              )}

              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <p className="text-red-800 text-sm">
                  <strong>Warning:</strong> You are about to delete order <strong>#{order?.shipping_code}</strong>.
                  This will permanently remove the order and all associated data including items, shipping information, and history.
                </p>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={handleOrderDelete}
                  variant="destructive"
                  disabled={deletingOrder}
                >
                  {deletingOrder ? "Deleting..." : "Yes, Delete Order"}
                </Button>
                <Button
                  onClick={() => setShowDeleteConfirm(false)}
                  variant="outline"
                  disabled={deletingOrder}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default OrderDetail;
