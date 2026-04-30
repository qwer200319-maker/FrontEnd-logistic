import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QrCode, ArrowLeft, Eye, Edit, Trash2, MoreHorizontal, AlertCircle, RefreshCw, Clock, ImageOff, X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Camera, Upload } from "lucide-react";
import Layout from "@/components/layout/Layout";
import api, { getMediaUrl } from "@/lib/api";

interface QROrder {
  id: number;
  invoice_number: string;
  status: string;
  note: string;
  created_at: string;
  images?: Array<{
    id: number;
    image: string;
    image_url?: string;
    qr_data?: string;
    uploaded_at?: string;
  }>;
  qrorderimage_set?: Array<{
    id: number;
    image: string;
    image_url?: string;
    qr_data?: string;
    uploaded_at?: string;
  }>;
  photo_urls?: string[];
}

const CreateOrderQRCodeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<QROrder | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Update form state
  const [isUpdating, setIsUpdating] = useState(false);
  const [password, setPassword] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [updateNote, setUpdateNote] = useState("");
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

  // Delete functionality state
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);

  // Image expiration state
  const [imageStatuses, setImageStatuses] = useState<Map<number, 'loading' | 'available' | 'expired' | 'error'>>(new Map());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Image loading timeouts
  const imageTimeouts = useRef<Map<number, NodeJS.Timeout>>(new Map());

  // Fullscreen modal state
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);

  // Touch/swipe handling for mobile
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Debug state
  const [debugMode, setDebugMode] = useState(false);

  // Image capture state for existing orders
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureStream, setCaptureStream] = useState<MediaStream | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);


  // Fetch order details
  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;

      try {
        // console.log("=== FETCHING QR ORDER DEBUG ===");
        // console.log("Fetching order ID:", id);
        const response = await api.get(`/qr-orders/${id}/`);
        // console.log("=== QR ORDER DETAIL DEBUG ===");
        // console.log("Full order response:", response.data);
        // console.log("Order ID:", id);
        // console.log("Response status:", response.status);

        // Use image_urls directly from API response as it's properly handled by the serializer
        const photoUrls = response.data.image_urls || [];
        // console.log("Photo URLs from API:", photoUrls);
        // console.log("Photo URLs count:", photoUrls.length);

        if (photoUrls.length > 0) {
          // console.log("=== FOUND PHOTO URLs ===");
          photoUrls.forEach((url: string, index: number) => {
            // console.log(`Photo URL ${index}:`, url);
          });
        } else {
          // console.log("=== NO PHOTO URLs FOUND ===");
          // console.log("Available data fields:", Object.keys(response.data));
        }

        setOrder(response.data);
        setPhotos(photoUrls);
        setNewStatus(response.data.status);
      } catch (err: any) {
        // console.error("Error fetching QR order:", err);
        if (err.response?.status === 404) {
          setError("QR order not found.");
        } else {
          setError("Failed to load QR order details. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  // Initialize image statuses when photos load
  useEffect(() => {
    if (photos.length > 0) {
      const initialStatuses = new Map();
      photos.forEach((url, index) => {
        initialStatuses.set(index, 'loading'); // Start with loading state
        // Set timeout for expired state if needed
        const timeout = setTimeout(() => {
          setImageStatuses(prev => {
            const newStatuses = new Map(prev);
            if (newStatuses.get(index) === 'loading') {
              newStatuses.set(index, 'expired');
            }
            return newStatuses;
          });
        }, 30000); // 30 seconds timeout
        imageTimeouts.current.set(index, timeout);
      });
      setImageStatuses(initialStatuses);
    } else {
      setImageStatuses(new Map());
    }
  }, [photos]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      imageTimeouts.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  // Refresh images
  const handleRefreshImages = async () => {
    if (!id) return;

    setIsRefreshing(true);
    try {
      const response = await api.get(`/qr-orders/${id}/`);
      // console.log("=== REFRESH DEBUG ===");
      // console.log("Refreshed order response:", response.data);

      // Use image_urls directly from API response as it's properly handled by the serializer
      const photoUrls = response.data.image_urls || [];

      setOrder(response.data);
      setPhotos(photoUrls);
      // Reset image statuses
      setImageStatuses(new Map());
      // console.log("Images refreshed successfully");
    } catch (err: any) {
      // console.error("Error refreshing images:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const closeImageModal = () => {
    setIsModalOpen(false);
    setSelectedImageIndex(null);
    setZoomLevel(1);
    setImageRotation(0);
  };

  const nextImage = () => {
    if (photos && selectedImageIndex !== null) {
      const nextIndex = (selectedImageIndex + 1) % photos.length;
      setSelectedImageIndex(nextIndex);
      setZoomLevel(1);
      setImageRotation(0);
    }
  };

  const prevImage = () => {
    if (photos && selectedImageIndex !== null) {
      const prevIndex = selectedImageIndex === 0 ? photos.length - 1 : selectedImageIndex - 1;
      setSelectedImageIndex(prevIndex);
      setZoomLevel(1);
      setImageRotation(0);
    }
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    // Only handle keyboard events when modal is open and we have images
    if (!isModalOpen || !photos) return;

    // Prevent default behavior for our handled keys
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        closeImageModal();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        prevImage();
        break;
      case 'ArrowRight':
        e.preventDefault();
        nextImage();
        break;
      case '+':
      case '=':
        e.preventDefault();
        handleZoomIn();
        break;
      case '-':
        e.preventDefault();
        handleZoomOut();
        break;
    }
  };

  // Add keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, selectedImageIndex, photos]);


  // Upload image to existing order
  const uploadImageToOrder = async (file: File) => {
    if (!order) return;

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post(`/qr-orders/${order.id}/add_image/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // console.log("Image uploaded successfully:", response.data);

      // Refresh order data to show new image
      const refreshedResponse = await api.get(`/qr-orders/${order.id}/`);
      setOrder(refreshedResponse.data);

      setUpdateSuccess("Image uploaded successfully!");
      setTimeout(() => setUpdateSuccess(null), 3000);
    } catch (err: any) {
      // console.error("Error uploading image:", err);
      setUpdateError(err.response?.data?.error || "Failed to upload image");
      setTimeout(() => setUpdateError(null), 3000);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle status update
  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !order) return;

    setIsUpdating(true);
    setUpdateError(null);
    setUpdateSuccess(null);

    try {
      console.log("Sending update request:", {
        password: password,
        status: newStatus,
        note: updateNote
      });

      const response = await api.patch(`/qr-orders/${id}/update_status/`, {
        password: password,
        status: newStatus,
        note: updateNote
      });

      // console.log("Update response:", response.data);

      // Update the order state with the response data
      if (response.data) {
        setOrder(prevOrder => ({
          ...prevOrder!,
          status: response.data.status || newStatus,
          note: response.data.note || updateNote
        }));
      }

      setUpdateSuccess("Status updated successfully!");
      setPassword("");
      setUpdateNote("");

      // Clear success message after 3 seconds
      setTimeout(() => setUpdateSuccess(null), 3000);
    } catch (err: any) {
      // console.error("Error updating status:", err);
      // console.error("Error response:", err.response?.data);
      setUpdateError(err.response?.data?.error || "Failed to update status. Please check your password and try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="ml-4 text-muted-foreground">Loading QR order details...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Card className="max-w-2xl mx-auto shadow-card">
          <CardContent className="p-6">
            <div className="text-destructive">{error}</div>
            <Button onClick={() => navigate("/qr-orders/list")} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
            </Button>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <Card className="max-w-2xl mx-auto shadow-card">
          <CardContent className="p-6">
            <div className="text-destructive">QR order not found.</div>
            <Button onClick={() => navigate("/qr-orders/list")} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
            </Button>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">QR Order Details</h1>
              <p className="text-muted-foreground">Details for invoice #{order.invoice_number}</p>
            </div>
          </div>
          {/* <Button variant="outline" size="sm" onClick={() => setDebugMode(!debugMode)}>
            🐛 Debug
          </Button> */}
        </div>

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

        {/* Debug Panel */}
        {debugMode && (
          <Card className="shadow-card border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900">🐛 Debug Information</CardTitle>
              <CardDescription className="text-blue-700">
                Troubleshooting image display issues
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="font-semibold text-blue-900">Order Data:</Label>
                  <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-32">
                    {JSON.stringify({
                      id: order.id,
                      invoice_number: order.invoice_number,
                      status: order.status,
                      created_at: order.created_at,
                      hasPhotos: !!photos,
                      photosCount: photos ? photos.length : 0
                    }, null, 2)}
                  </pre>
                </div>
                <div>
                  <Label className="font-semibold text-blue-900">Photos Data:</Label>
                  <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-32">
                    {photos ? JSON.stringify(photos, null, 2) : 'No photos array'}
                  </pre>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleRefreshImages} disabled={isRefreshing} size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
                </Button>
                <Button onClick={() => setDebugMode(false)} variant="outline" size="sm">
                  Hide Debug
                </Button>
              </div>

              <div className="text-xs text-blue-700 bg-blue-100 p-3 rounded">
                <p className="font-semibold mb-1">🔍 Troubleshooting Steps:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Check if images were uploaded during order creation</li>
                  <li>Verify backend is returning images in response</li>
                  <li>Check browser console for detailed logs</li>
                  <li>Try refreshing data to reload from server</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Update Status Form */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Edit className="h-5 w-5" />
              <span>Update Status</span>
            </CardTitle>
            <CardDescription>
              Enter password to update order status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateStatus} className="space-y-4">
              {updateSuccess && (
                <Alert variant="default" className="bg-green-100 border-green-200">
                  <AlertDescription className="text-green-800">{updateSuccess}</AlertDescription>
                </Alert>
              )}

              {updateError && (
                <Alert variant="destructive">
                  <AlertDescription>{updateError}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="returned">Returned</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="update-note">Note</Label>
                <Textarea
                  id="update-note"
                  value={updateNote}
                  onChange={(e) => setUpdateNote(e.target.value)}
                  placeholder="Add a note about the status update"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-primary hover:shadow-primary"
                disabled={isUpdating}
              >
                {isUpdating ? "Updating Status..." : "Update Status"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <QrCode className="h-5 w-5" />
              <span>Order Information</span>
            </CardTitle>
            <CardDescription>
              QR order details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Invoice Number</Label>
                <p className="text-sm">{order.invoice_number}</p>
              </div>

              <div>
                <Label>Status</Label>
                <p className="text-sm">{order.status}</p>
              </div>

              <div>
                <Label>Created At</Label>
                <p className="text-sm">{new Date(order.created_at).toLocaleString()}</p>
              </div>

              <div>
                <Label>Note</Label>
                <p className="text-sm">{order.note || "No note provided"}</p>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Order Images Display */}
        {photos && photos.length > 0 && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Camera className="h-5 w-5" />
                <span>Order Photos ({photos.length})</span>
              </CardTitle>
              <CardDescription>
                Photos captured for this QR order
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map((photoUrl, index) => {
                  const imageStatus = imageStatuses.get(index);

                  return (
                    <div key={index} className="relative group">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 cursor-pointer hover:border-blue-400 transition-colors" onClick={() => {
                        setSelectedImageIndex(index);
                        setIsModalOpen(true);
                      }}>
                        {imageStatus === 'loading' && (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                          </div>
                        )}
                        {imageStatus === 'available' && (
                          <img
                            src={photoUrl}
                            alt={`Order photo ${index + 1}`}
                            className="w-full h-full object-cover"
                            crossOrigin="anonymous"
                            onLoad={() => {
                              setImageStatuses(prev => new Map(prev.set(index, 'available')));
                              // Clear timeout on successful load
                              if (imageTimeouts.current.has(index)) {
                                clearTimeout(imageTimeouts.current.get(index)!);
                                imageTimeouts.current.delete(index);
                              }
                            }}
                            onError={() => {
                              setImageStatuses(prev => new Map(prev.set(index, 'error')));
                              // Clear timeout on error
                              if (imageTimeouts.current.has(index)) {
                                clearTimeout(imageTimeouts.current.get(index)!);
                                imageTimeouts.current.delete(index);
                              }
                            }}
                          />
                        )}
                        {imageStatus === 'expired' && (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                            <ImageOff className="h-8 w-8 mb-2" />
                            <p className="text-xs text-center">Image expired</p>
                          </div>
                        )}
                        {imageStatus === 'error' && (
                          <div className="w-full h-full flex flex-col items-center justify-center text-red-500">
                            <AlertCircle className="h-8 w-8 mb-2" />
                            <p className="text-xs text-center">Failed to load</p>
                          </div>
                        )}

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
                  );
                })}
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
                          onClick={handleZoomOut}
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
                          onClick={handleZoomIn}
                          disabled={zoomLevel >= 3}
                        >
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={closeImageModal}
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
                            onError={(e) => {
                              console.error('Failed to load image in modal:', e);
                              console.error('Image URL:', photos[selectedImageIndex]);
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
                              onClick={prevImage}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                              onClick={nextImage}
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
          <Card className="shadow-card border-dashed border-gray-300">
            <CardContent className="p-8 text-center">
              <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Photos Available</h3>
              <p className="text-gray-500">No photos were captured for this QR order.</p>
            </CardContent>
          </Card>
        )}

      </div>
    </Layout>
  );
};

export default CreateOrderQRCodeDetail;
