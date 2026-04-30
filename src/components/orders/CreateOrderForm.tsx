import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Package, ArrowLeft, Plus, Trash2, QrCode, Camera, Upload } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/Layout";
import { isAdmin, isCustomer } from "@/lib/auth";
import api from "@/lib/api";
import QRScanner from "@/components/payments/QRScanner";
import jsQR from "jsqr";

interface Location {
  id: number;
  name: string;
}

interface UserMini {
  id: number;
  full_name: string;
}

// Item interface
interface OrderItem {
  id: string;
  invoice_number: string;
}

const CreateOrderForm = () => {
  const [formData, setFormData] = useState({
    shipping_date: new Date().toISOString().split("T")[0],
    sender_phone: "",
    receiver_phone: "",
    shipping_cost: "",
    shipping_fee: "",
    calculation_type: "kg",
    total_value: "",
    delivery_address_id: "",
    shipping_location_id: "",
    ordered_to_id: "",
  });
  
  const [items, setItems] = useState<OrderItem[]>([
    {
      id: Date.now().toString(),
      invoice_number: "",
    }
  ]);
  

  const [locations, setLocations] = useState<Location[]>([]);
  const [users, setUsers] = useState<UserMini[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  // QR Scanner state
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scanningForItemId, setScanningForItemId] = useState<string | null>(null);

  // Refs for QR processing
  const canvasRef = useRef<HTMLCanvasElement>(null);


  // Initialize form data based on user role
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log("User data from localStorage:", user);
        if (isCustomer() && user && user.id) {
          // For customers, pre-fill ordered_to_id with their own ID
          console.log("Setting ordered_to_id for customer:", user.id);
          setFormData(prev => ({ ...prev, ordered_to_id: user.id.toString() }));
        } else if (isAdmin() && user && user.id) {
          // For admins, initialize with empty string (they'll select from dropdown)
          console.log("Admin user detected, keeping ordered_to_id empty");
          setFormData(prev => ({ ...prev, ordered_to_id: "" }));
        }
      } catch (error) {
        console.error("Failed to parse user from localStorage:", error);
      }
    } else {
      console.warn("No user data found in localStorage");
    }
  }, []);

  // Fetch locations & users
  useEffect(() => {
    const fetchData = async () => {
      try {
        const locRes = await api.get("/locations/");
        setLocations(locRes.data);

        // Only fetch users if the user is an admin
        if (isAdmin()) {
          const userRes = await api.get("/users/");
          setUsers(userRes.data);
        } else {
          // For customers, they create orders for themselves
          // No need to fetch other users
          setUsers([]);
        }
      } catch (err: any) {
        if (err.response?.status === 403) {
          // Handle unauthorized access
          setError("You don't have permission to access this data");
        } else {
          setError(err.message || "Failed to load data");
        }
      }
    };
    fetchData();
  }, []);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  // Handle item changes
  const handleItemChange = (id: string, field: keyof OrderItem, value: string | number) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === id
          ? {
              ...item,
              [field]: value
            }
          : item
      )
    );
  };
  
  // Add new item
  const addItem = () => {
    setItems(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        invoice_number: "",
      }
    ]);
  };
  
  // Remove item
  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(prevItems => prevItems.filter(item => item.id !== id));
    }
  };

  // Handle QR scan success
  const handleQRScanSuccess = (qrData: string) => {
    if (scanningForItemId) {
      handleItemChange(scanningForItemId, 'invoice_number', qrData);
      setShowQRScanner(false);
      setScanningForItemId(null);
      toast({ title: "QR Code Scanned", description: "Invoice number has been filled from QR code" });
    }
  };

  // Handle QR scan error
  const handleQRScanError = (error: string) => {
    toast({ title: "Scan Error", description: error, variant: "destructive" });
  };

  // Start QR scanning for specific item
  const startQRScanForItem = (itemId: string) => {
    setScanningForItemId(itemId);
    setShowQRScanner(true);
  };

  // Handle image upload for QR code
  const handleImageUploadForQR = async (itemId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            (async () => {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              if (ctx) {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0, img.width, img.height);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                // Import jsQR dynamically
                const { default: jsQR } = await import('jsqr');
                const code = jsQR(imageData.data, imageData.width, imageData.height);
                if (code) {
                  handleItemChange(itemId, 'invoice_number', code.data);
                  toast({ title: "QR Code Detected", description: "Invoice number extracted from uploaded image" });
                } else {
                  toast({ title: "No QR Code Found", description: "Please upload an image containing a valid QR code", variant: "destructive" });
                }
              }
            })();
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error("Error processing QR image:", error);
        toast({ title: "Upload Error", description: "Failed to process the uploaded image", variant: "destructive" });
      }
    }
    // Reset file input
    event.target.value = '';
  };
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validate items
    const hasValidItems = items.some(item => {
      return item.invoice_number.trim() !== "";
    });

    if (!hasValidItems) {
      setError("At least one item with a valid invoice number is required.");
      setIsLoading(false);
      return;
    }

    try {
      // Get the current user's data
      const userStr = localStorage.getItem("user");
      let currentUser = null;
      if (userStr) {
        try {
          currentUser = JSON.parse(userStr);
        } catch (error) {
          console.error("Failed to parse user from localStorage:", error);
        }
      }

      // Determine ordered_to_id based on user role
      let orderedToId = Number(formData.ordered_to_id);

      console.log("Initial formData.ordered_to_id:", formData.ordered_to_id);
      console.log("Current user:", currentUser);
      console.log("Is customer:", isCustomer());
      console.log("Is admin:", isAdmin());

      if (isCustomer() && currentUser) {
        // For customers, they can only create orders for themselves
        // The admin_owner will be set automatically by the backend
        orderedToId = currentUser.id;
        console.log("Setting orderedToId for customer:", orderedToId);
      } else if (isAdmin() && !orderedToId) {
        // For admins, if no ordered_to is selected, default to themselves
        orderedToId = currentUser?.id || 1;
        console.log("Setting orderedToId for admin:", orderedToId);
      }

      // Ensure orderedToId is a valid number
      if (!orderedToId || isNaN(orderedToId)) {
        console.error("Invalid orderedToId:", orderedToId);
        setError("Please select a valid recipient for the order");
        setIsLoading(false);
        return;
      }

      // Ensure all numeric fields are properly converted
      const deliveryAddressId = Number(formData.delivery_address_id);
      const shippingLocationId = Number(formData.shipping_location_id);

      // Validate required numeric fields
      if (isNaN(deliveryAddressId) || deliveryAddressId <= 0) {
        setError("Please select a valid delivery address");
        setIsLoading(false);
        return;
      }

      if (isNaN(shippingLocationId) || shippingLocationId <= 0) {
        setError("Please select a valid shipping location");
        setIsLoading(false);
        return;
      }

      // Prepare items data for submission
      const itemsData = items.map(item => ({
        invoice_number: item.invoice_number,
      }));

      const payload = {
        shipping_date: formData.shipping_date,
        sender_phone: formData.sender_phone,
        receiver_phone: formData.receiver_phone,
        shipping_cost: formData.shipping_cost === "" ? null : parseFloat(formData.shipping_cost),
        shipping_fee: formData.shipping_fee === "" ? null : parseFloat(formData.shipping_fee),
        calculation_type: formData.calculation_type,
        total_value: formData.total_value === "" ? null : parseFloat(formData.total_value),
        delivery_address_id: deliveryAddressId,
        shipping_location_id: shippingLocationId,
        ordered_to_id: orderedToId,
        items: itemsData,
      };

      console.log("Final payload:", payload);
      console.log("ordered_to_id type:", typeof payload.ordered_to_id);
      console.log("ordered_to_id value:", payload.ordered_to_id);
      console.log("Items data being sent:", payload.items);
      console.log("Items count:", payload.items.length);
      payload.items.forEach((item, index) => {
        console.log(`Item ${index + 1} invoice_number: '${item.invoice_number}' (type: ${typeof item.invoice_number})`);
      });

      const res = await api.post("/shipping-orders/", payload);

      // Success case - Axios automatically throws for non-2xx status codes
      const data = res.data;
      toast({ title: "Order Created", description: `Order #${data.shipping_code} created successfully` });
      navigate("/orders");
    } catch (err: any) {
      console.error("Order creation error:", err);
      // Handle different error types
      if (err.response) {
        // Server responded with error status
        const errData = err.response.data;
        if (err.response.status === 400) {
          // Validation error
          if (errData.ordered_to_id) {
            setError("Invalid recipient selected. Please try again.");
          } else if (errData.message) {
            setError(errData.message);
          } else {
            setError("Invalid data, please check all inputs");
          }
        } else if (err.response.status === 403) {
          setError("You don't have permission to create orders");
        } else {
          setError("Failed to create order. Please try again.");
        }
      } else if (err.request) {
        // Network error
        setError("Network error. Please check your connection and try again.");
      } else {
        // Other error
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create Shipping Order</h1>
            <p className="text-muted-foreground">Fill in the details to create a new shipping order</p>
          </div>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2"><Package className="h-5 w-5" /><span>Order Details</span></CardTitle>
            <CardDescription>Enter the product and delivery information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

              <div>
                <Label htmlFor="shipping_date">Shipping Date</Label>
                <Input id="shipping_date" type="date" value={formData.shipping_date} onChange={e => handleChange("shipping_date", e.target.value)} required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label htmlFor="sender_phone">Sender Phone</Label><Input id="sender_phone" type="tel" value={formData.sender_phone} onChange={e => handleChange("sender_phone", e.target.value)} required /></div>
                <div><Label htmlFor="receiver_phone">Receiver Phone</Label><Input id="receiver_phone" type="tel" value={formData.receiver_phone} onChange={e => handleChange("receiver_phone", e.target.value)} required /></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shipping_cost">Shipping Cost</Label>
                <Input
                  id="shipping_cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.shipping_cost ?? ""}
                  onChange={e => handleChange("shipping_cost", e.target.value === "" ? null : e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="shipping_fee">Shipping Fee</Label>
                <Input
                  id="shipping_fee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.shipping_fee ?? ""}
                  onChange={e => handleChange("shipping_fee", e.target.value === "" ? null : e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="total_value">Total Value</Label>
                <Input
                  id="total_value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.total_value ?? ""}
                  onChange={e => handleChange("total_value", e.target.value === "" ? null : e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="calculation_type">Unit</Label>
                <select
                  id="calculation_type"
                  value={formData.calculation_type}
                  onChange={e => handleChange("calculation_type", e.target.value)}
                  className="w-full rounded-md border px-3 py-2"
                  title="Select calculation type"
                  required
                >
                  <option value="kg">Kg</option>
                  <option value="ton">Ton</option>
                  <option value="cbm">CBM</option>
                </select>
              </div>
            </div>



              {/* Items Section */}
              <div>
                <div className="flex justify-between items-center mb-2 text-green-600">
                  <Label>Items</Label>
                  <div className="flex space-x-2">
                    <Button type="button" variant="outline" size="sm" onClick={addItem}>
                      <Plus className="h-4 w-4 mr-1" /> Add Item
                    </Button>
                  </div>
                </div>
                
                {items.map((item, index) => (
                   <Card key={item.id} className="mb-4">
                     <CardContent className="pt-4">
                       <div className="flex justify-between items-center mb-3">
                         <h3 className="font-medium">Invoice {index + 1}</h3>
                         {items.length > 1 && (
                           <Button
                             type="button"
                             variant="outline"
                             size="sm"
                             onClick={() => removeItem(item.id)}
                           >
                             <Trash2 className="h-4 w-4 text-red-500" />
                           </Button>
                         )}
                       </div>

                       <div>
                         <Label htmlFor={`invoice_number_${item.id}`}>Invoice Number</Label>
                         <div className="flex space-x-2">
                           <Input
                             id={`invoice_number_${item.id}`}
                             value={item.invoice_number}
                             onChange={e => handleItemChange(item.id, 'invoice_number', e.target.value)}
                             placeholder="Enter or scan invoice number"
                             className="flex-1"
                           />
                           <Button
                             type="button"
                             variant="outline"
                             size="sm"
                             onClick={() => startQRScanForItem(item.id)}
                             className="px-3"
                           >
                             <QrCode className="h-4 w-4" />
                           </Button>
                           <div className="relative">
                             <Button
                               type="button"
                               variant="outline"
                               size="sm"
                               className="px-3"
                               onClick={() => document.getElementById(`qr-upload-${item.id}`)?.click()}
                             >
                               <Upload className="h-4 w-4" />
                             </Button>
                             <input
                               id={`qr-upload-${item.id}`}
                               type="file"
                               accept="image/*"
                               className="hidden"
                               onChange={(e) => handleImageUploadForQR(item.id, e)}
                               title="Upload QR code image"
                             />
                           </div>
                         </div>
                         <p className="text-xs text-muted-foreground mt-1">
                           Click QR icon to scan or upload icon to select image with QR code
                         </p>
                       </div>
                     </CardContent>
                   </Card>
                 ))}
                
              </div>

              {isAdmin() && (
                <div>
                  <Label htmlFor="ordered_to_select">Order To (User)</Label>
                  <select id="ordered_to_select" value={formData.ordered_to_id} onChange={e => handleChange("ordered_to_id", e.target.value)} required className="w-full rounded-md border px-3 py-2" title="Select user">
                    <option value="">Select user</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <Label htmlFor="delivery_address_select">Delivery Address</Label>
                <select id="delivery_address_select" value={formData.delivery_address_id} onChange={e => handleChange("delivery_address_id", e.target.value)} required className="w-full rounded-md border px-3 py-2" title="Select delivery address">
                  <option value="">Select delivery address</option>
                  {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                </select>
              </div>

              <div>
                <Label htmlFor="shipping_location_select">Shipping Location</Label>
                <select id="shipping_location_select" value={formData.shipping_location_id} onChange={e => handleChange("shipping_location_id", e.target.value)} required className="w-full rounded-md border px-3 py-2" title="Select shipping location">
                  <option value="">Select location</option>
                  {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                </select>
              </div>

              <Button type="submit" className="w-full bg-gradient-primary hover:shadow-primary" disabled={isLoading}>
                {isLoading ? "Creating Order..." : "Create Order"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* QR Scanner Modal */}
        {showQRScanner && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Scan QR Code for Invoice Number</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowQRScanner(false);
                    setScanningForItemId(null);
                  }}
                >
                  ✕
                </Button>
              </div>
              <QRScanner
                onScanSuccess={handleQRScanSuccess}
                onScanError={handleQRScanError}
              />
            </div>
          </div>
        )}

        {/* Hidden canvas for QR processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </Layout>
  );
};

export default CreateOrderForm;
