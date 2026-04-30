import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Package, Truck, CheckCircle, Clock, MapPin, User, Phone, Calendar, DollarSign, FileText, QrCode, Camera, Eye, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";

interface OrderData {
  id: number;
  invoice_number?: string;
  status: string;
  note?: string;
  created_at: string;
  updated_at: string;
  shipping_code?: string;
  shipping_date?: string;
  sender_phone?: string;
  receiver_phone?: string;
  shipping_cost?: number;
  shipping_fee?: number;
  delivery_address?: string;
  ordered_by?: {
    id: number;
    full_name: string;
    email: string;
  };
  ordered_to?: {
    id: number;
    full_name: string;
    email: string;
  };
  shipping_location?: {
    id: number;
    name: string;
  };
  items?: Array<{
    id: number;
    invoice_number: string;
  }>;
  images?: Array<{
    id: number;
    image: string;
    image_url?: string;
    qr_data?: string;
    uploaded_at: string;
  }>;
  image_urls?: string[];
  qrorderimage_set?: Array<{
    id: number;
    image: string;
    image_url?: string;
    qr_data?: string;
    uploaded_at: string;
  }>;
  photo_urls?: string[];
  message?: string; // Added message field for shipment status
}

const PublicDetail = () => {
  const { invoice_number } = useParams<{ invoice_number: string }>();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Image modal state
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);

  // Determine if shipment has arrived in Cambodia
  const hasArrivedInCambodia = () => {
    // Check if we have shipping order details (which means shipment has arrived)
    // The backend sets the message field to indicate arrival status
    return orderData?.message === 'The shipment has arrived in Cambodia.';
  };

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!invoice_number) {
        setError("Invoice number is required");
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get(`/public/invoice/search/?invoice_number=${encodeURIComponent(invoice_number)}`);

        if (response.data.found) {
          const orderData = response.data.data;
          setOrderData(orderData);

          // Handle different image sources for QR orders vs shipping orders
          let photoUrls: string[] = [];
          if (orderData.image_urls && orderData.image_urls.length > 0) {
            // QR orders use image_urls
            photoUrls = orderData.image_urls;
          } else if (orderData.images && orderData.images.length > 0) {
            // Shipping orders might use images array
            photoUrls = orderData.images
              .filter((img: any) => img.image || img.image_url)
              .map((img: any) => img.image_url || img.image);
          } else if (orderData.qrorderimage_set && orderData.qrorderimage_set.length > 0) {
            // Alternative QR order images
            photoUrls = orderData.qrorderimage_set
              .filter((img: any) => img.image_url)
              .map((img: any) => img.image_url);
          }

          setPhotos(photoUrls);
        } else {
          setError("Order not found");
        }
      } catch (err: any) {
        console.error("Error fetching order details:", err);
        if (err.response?.status === 404) {
          setError("Order not found");
        } else {
          setError("Failed to load order details. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [invoice_number]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in_transit':
        return <Truck className="h-5 w-5 text-blue-600" />;
      case 'pending':
      case 'confirmed':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'cancelled':
      case 'returned':
        return <Package className="h-5 w-5 text-red-600" />;
      default:
        return <Package className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_transit':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
      case 'confirmed':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
      case 'returned':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => navigate("/search")} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Search
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!orderData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate("/search")}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Search</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
              <p className="text-gray-600">Invoice #{orderData.invoice_number}</p>
            </div>
          </div>
        </div>

        {/* Order Status */}
        <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(orderData.status)}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Order Status</h2>
                  <Badge className={`mt-1 ${getStatusColor(orderData.status)}`}>
                    {orderData.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Order ID</p>
                <p className="font-mono text-gray-900">#{orderData.id}</p>
              </div>
            </div>

            {/* Shipment Status Message */}
            <div className="mt-4 p-4 rounded-lg border">
              {hasArrivedInCambodia() ? (
                <div className="flex items-center space-x-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">The shipment has arrived in Cambodia.</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-orange-700">
                  <Clock className="h-5 w-5" />
                  <span className="font-medium">The shipment has not yet arrived in Cambodia.</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* QR Order Info Section - Always shown */}
        <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <QrCode className="h-5 w-5" />
              <span>QR Order Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Invoice Number</Label>
                <p className="text-lg font-mono text-gray-900">{orderData.invoice_number}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Created Date</Label>
                <p className="text-gray-900">{formatDate(orderData.created_at)}</p>
              </div>

              {orderData.note && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Notes</Label>
                  <p className="text-gray-900 whitespace-pre-wrap">{orderData.note}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Shipping Information - Only show if shipment has arrived */}
        {hasArrivedInCambodia() && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order Information */}
            <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Order Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Shipping Code</Label>
                    <p className="text-lg font-mono text-gray-900">{orderData.shipping_code || 'N/A'}</p>
                  </div>

                  {orderData.shipping_date && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Shipping Date</Label>
                      <p className="text-gray-900">{formatDate(orderData.shipping_date)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Shipping Information */}
            <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>Shipping Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {/* Always show delivery address if available, otherwise show N/A */}
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Delivery Address</Label>
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {orderData.delivery_address || 'N/A'}
                    </p>
                  </div>

                  {/* Always show shipping location if available, otherwise show N/A */}
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Shipping Location</Label>
                    <p className="text-gray-900">
                      {orderData.shipping_location?.name || 'N/A'}
                    </p>
                  </div>

                  {/* Always show shipping cost, default to 0 if not available */}
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Shipping Cost</Label>
                    <p className="text-lg font-semibold text-gray-900">
                      {orderData.shipping_cost !== undefined && orderData.shipping_cost !== null
                        ? formatCurrency(orderData.shipping_cost)
                        : formatCurrency(0)}
                    </p>
                  </div>

                  {/* Always show shipping fee, default to 0 if not available */}
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Shipping Fee</Label>
                    <p className="text-lg font-semibold text-gray-900">
                      {orderData.shipping_fee !== undefined && orderData.shipping_fee !== null
                        ? formatCurrency(orderData.shipping_fee)
                        : formatCurrency(0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Party Information - Only show if shipment has arrived */}
        {hasArrivedInCambodia() && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {orderData.ordered_by && (
              <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Sender Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Name</Label>
                    <p className="text-gray-900">{orderData.ordered_by.full_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Email</Label>
                    <p className="text-gray-900">{orderData.ordered_by.email}</p>
                  </div>
                  {orderData.sender_phone && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Phone</Label>
                      <p className="text-gray-900">{orderData.sender_phone}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {orderData.ordered_to && (
              <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Receiver Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Name</Label>
                    <p className="text-gray-900">{orderData.ordered_to.full_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Email</Label>
                    <p className="text-gray-900">{orderData.ordered_to.email}</p>
                  </div>
                  {orderData.receiver_phone && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Phone</Label>
                      <p className="text-gray-900">{orderData.receiver_phone}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Order Items - Only show if shipment has arrived */}
        {hasArrivedInCambodia() && orderData.items && orderData.items.length > 0 && (
          <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm mt-6">
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>Items included in this order</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {orderData.items.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Package className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-medium text-gray-900">Item #{index + 1}</p>
                        <p className="text-sm text-gray-600">Invoice: {item.invoice_number}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Images - Always show QR order images, shipping images only if arrived */}
        {photos && photos.length > 0 && (
          <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm mt-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Camera className="h-5 w-5" />
                <span>Order Photos ({photos.length})</span>
              </CardTitle>
              <CardDescription>
                Photos captured for this order
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map((photoUrl, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 cursor-pointer hover:border-blue-400 transition-colors" onClick={() => {
                      setSelectedImageIndex(index);
                      setIsModalOpen(true);
                    }}>
                      <img
                        src={photoUrl}
                        alt={`Order photo ${index + 1}`}
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-image.png';
                        }}
                      />

                      {/* Click to view overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                        <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>

                    {/* Image info */}
                    <div className="mt-2 text-xs text-gray-600">
                      <p>Photo {index + 1}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Fullscreen Image Modal */}
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] p-0">
                  <DialogHeader className="p-4 pb-0">
                    <DialogTitle className="flex items-center justify-between">
                      <span>Order Photo {selectedImageIndex !== null ? selectedImageIndex + 1 : ''} of {photos?.length || 0}</span>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.5))}
                          disabled={zoomLevel <= 0.5}
                        >
                          <ZoomOut className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                          {Math.round(zoomLevel * 100)}%
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 3))}
                          disabled={zoomLevel >= 3}
                        >
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsModalOpen(false);
                            setSelectedImageIndex(null);
                            setZoomLevel(1);
                            setImageRotation(0);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </DialogTitle>
                  </DialogHeader>

                  <div className="relative flex-1 overflow-hidden">
                    {selectedImageIndex !== null && photos && (
                      <>
                        <div className="flex items-center justify-center h-[60vh] bg-black">
                          <img
                            src={photos[selectedImageIndex]}
                            alt={`Order photo ${selectedImageIndex + 1}`}
                            className="max-w-full max-h-full object-contain transition-transform duration-200"
                            style={{
                              transform: `scale(${zoomLevel}) rotate(${imageRotation}deg)`,
                            }}
                            crossOrigin="anonymous"
                            onError={() => {
                              console.error('Failed to load image in modal');
                            }}
                          />
                        </div>

                        {/* Navigation arrows */}
                        {photos.length > 1 && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                              onClick={() => {
                                if (selectedImageIndex !== null) {
                                  const prevIndex = selectedImageIndex === 0 ? photos.length - 1 : selectedImageIndex - 1;
                                  setSelectedImageIndex(prevIndex);
                                  setZoomLevel(1);
                                  setImageRotation(0);
                                }
                              }}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                              onClick={() => {
                                if (selectedImageIndex !== null) {
                                  const nextIndex = (selectedImageIndex + 1) % photos.length;
                                  setSelectedImageIndex(nextIndex);
                                  setZoomLevel(1);
                                  setImageRotation(0);
                                }
                              }}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </>
                        )}

                        {/* Image info overlay */}
                        <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white p-3 rounded">
                          <div className="flex justify-between items-center text-sm">
                            <div>
                              <p>Photo {selectedImageIndex + 1} of {photos.length}</p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )}

        {/* No Images Message */}
        {(!photos || photos.length === 0) && (
          <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm border-dashed border-gray-300 mt-6">
            <CardContent className="p-8 text-center">
              <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Photos Available</h3>
              <p className="text-gray-500">No photos were captured for this order.</p>
            </CardContent>
          </Card>
        )}

        {/* Footer Actions */}
        <div className="flex justify-center space-x-4 mt-8">
          <Button
            onClick={() => navigate("/search")}
            variant="outline"
            className="px-8"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Search Another Order
          </Button>
          {/* <Button
            onClick={() => navigate("/")}
            className="px-8"
          >
            Back to Home
          </Button> */}
        </div>
      </div>
    </div>
  );
};

export default PublicDetail;