import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Truck,
  Package,
  User,
  Phone,
  MapPin,
  Calendar,
  Camera,
  Upload,
  Lock,
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
  images: any[]; // We'll add proper typing later
}

const OrderDetailNew: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [password, setPassword] = useState<string>('');
  const [newStatus, setNewStatus] = useState<string>('');
  const [statusNotes, setStatusNotes] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [imageMessage, setImageMessage] = useState<string | null>(null);
  const [useCamera, setUseCamera] = useState<boolean>(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await api.get(`/order-detail-new/${orderId}/`);
        setOrder(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to fetch order details.");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile || !orderId) return;

    setUploadingImage(true);
    setImageMessage(null);

    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await api.post(
        `/order-detail-new/${orderId}/upload-image/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setImageMessage('Image uploaded successfully!');
      setImageFile(null);
      setImagePreview(null);
      
      // Refresh order data to show new image
      const responseOrder = await api.get(`/order-detail-new/${orderId}/`);
      setOrder(responseOrder.data);
    } catch (err: any) {
      setImageMessage(err.response?.data?.error || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!orderId || !password || !newStatus) {
      setStatusMessage('Please provide password and select a status');
      return;
    }

    try {
      const response = await api.post(`/order-detail-new/${orderId}/update-status/`, {
        password,
        status: newStatus,
        notes: statusNotes,
      });

      setStatusMessage('Status updated successfully!');
      setPassword('');
      setNewStatus('');
      setStatusNotes('');
      
      // Update order status in state
      if (order) {
        setOrder({ ...order, status: response.data.status });
      }
    } catch (err: any) {
      setStatusMessage(err.response?.data?.error || 'Failed to update status');
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
    return <Layout><div className="flex justify-center items-center h-64">Loading...</div></Layout>;
  }

  if (error) {
    return <Layout><div className="flex justify-center items-center h-64 text-red-500">Error: {error}</div></Layout>;
  }

  if (!order) {
    return <Layout><div className="flex justify-center items-center h-64">Order not found.</div></Layout>;
  }

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
          <Button onClick={() => navigate(-1)}>Back</Button>
        </div>

        {statusMessage && (
          <div className={`p-4 rounded-md ${statusMessage.includes('successfully') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {statusMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:col-span-3 space-y-6">
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
                                <div className="flex-shrink-0 w-12 h-12 rounded bg-gray-200 border border-gray-300 flex items-center justify-center">
                                  <Package className="w-6 h-6 text-gray-400" />
                                </div>
                                
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
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Total Value */}
                        {order.total_value !== null && (
                          <div className="p-4 bg-gray-50 border-t">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-sm">Total Value</span>
                              <span className="font-bold text-base">
                                {order.total_value.toFixed(3)} {order.calculation_type === "kg" ? "Kg" : order.calculation_type === "ton" ? "Ton" : "CBM"}
                              </span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No items found for this order.</p>
                )}
              </CardContent>
            </Card>

            {/* Image Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Camera className="mr-2 h-5 w-5" />
                  Upload Images
                </CardTitle>
              </CardHeader>
              <CardContent>
                {imageMessage && (
                  <div className={`mb-4 p-2 rounded ${imageMessage.includes('successfully') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {imageMessage}
                  </div>
                )}
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Input
                      type="file"
                      accept="image/*"
                      capture={useCamera ? "environment" : undefined}
                      onChange={handleImageChange}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleImageUpload}
                      disabled={!imageFile || uploadingImage}
                    >
                      {uploadingImage ? 'Uploading...' : 'Upload'}
                    </Button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="useCamera"
                      checked={useCamera}
                      onChange={(e) => setUseCamera(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="useCamera" className="text-sm text-gray-700">
                      Use camera to take photo
                    </label>
                  </div>
                  
                  {imagePreview && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Preview:</h4>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-w-full h-48 object-contain border rounded"
                      />
                    </div>
                  )}
                  
                  {order.images && order.images.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Uploaded Images:</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {order.images.map((image: any) => (
                          <img
                            key={image.id}
                            src={image.image}
                            alt="Order"
                            className="w-full h-24 object-cover border rounded"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
    
        </div>
        <div className="gap-6 "> 
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center">
                  <User className="h-5 w-5 mr-3 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Sender</p>
                    <p className="text-sm text-muted-foreground">{order.ordered_by.full_name}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <User className="h-5 w-5 mr-3 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Receiver</p>
                    <p className="text-sm text-muted-foreground">{order.ordered_to.full_name}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Phone className="h-5 w-5 mr-3 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Sender Phone</p>
                    <p className="text-sm text-muted-foreground">{order.sender_phone}</p>
                  </div>
                </div>
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
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-3 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Delivery Address</p>
                    <p className="text-sm text-muted-foreground">{order.delivery_address}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-3 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Shipping Date</p>
                    <p className="text-sm text-muted-foreground">{new Date(order.shipping_date).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Update Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="mr-2 h-5 w-5" />
                  Update Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                  />
                </div>
                
                <div>
                  <Label htmlFor="status">New Status</Label>
                  <select
                    id="status"
                    title='staus'
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="in_transit">In Transit</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="returned">Returned</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    placeholder="Add notes about the status change"
                  />
                </div>
                
                <Button 
                  onClick={handleStatusUpdate} 
                  disabled={!password || !newStatus}
                  className="w-full"
                >
                  Update Status
                </Button>
              </CardContent>
            </Card>
      </div>
    </Layout>
  );
};

export default OrderDetailNew;