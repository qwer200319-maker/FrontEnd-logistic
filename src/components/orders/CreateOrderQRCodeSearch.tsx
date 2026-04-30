import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import jsQR from "jsqr";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QrCode, Scan, CheckCircle, ArrowLeft, Camera, Upload, X, AlertCircle } from "lucide-react";
import Layout from "@/components/layout/Layout";
import api from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

interface QROrder {
  id: number;
  invoice_number: string;
  status: string;
  note: string;
  created_at: string;
}

const CreateOrderQRCodeSearch = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [scannedInvoice, setScannedInvoice] = useState<string | null>(null);
  const [orderExists, setOrderExists] = useState<boolean | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [searchedInvoice, setSearchedInvoice] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<'none' | 'live' | 'capture'>('none');
  const [scanSuccess, setScanSuccess] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");

  // New state for order comparison
  const [orders, setOrders] = useState<QROrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mobile detection utility (matching CreateOrderQRCode.tsx exactly)
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            (window.innerWidth <= 768 && window.innerHeight <= 1024);
  };

  // Fetch orders for comparison (to check if invoice exists)
  useEffect(() => {
    const fetchOrders = async () => {
      setLoadingOrders(true);
      try {
        const response = await api.get("/qr-orders/");
        setOrders(response.data);
      } catch (err: any) {
        console.error("Error fetching QR orders:", err);
        // Don't set error state here as this is background loading
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchOrders();
  }, []);

  // Start live camera scanning with real-time preview (matching CreateOrderQRCode.tsx)
  const startLiveCameraScan = async () => {
    try {
      setError("");
      setDebugInfo("Starting live camera scan...");

      // Stop any existing stream
      if (streamRef.current) {
        stopCamera();
      }

      // Check for camera support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Camera is not supported in this browser. Please use a modern browser.");
        return;
      }

      // Request camera access with optimized constraints (mobile-friendly)
      let videoConstraints: any = {
        facingMode: "environment",
        width: { ideal: 640, max: 1280 },
        height: { ideal: 480, max: 720 }
      };

      // For mobile devices, try simpler constraints first
      if (isMobile()) {
        console.log("📱 Using mobile-optimized camera constraints");
        videoConstraints = {
          facingMode: "environment"
        };
      }

      const constraints: MediaStreamConstraints = {
        video: videoConstraints
      };

      console.log("Requesting camera access...");
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        videoRef.current.onloadedmetadata = () => {
          console.log("📹 Video metadata loaded - Dimensions:", videoRef.current?.videoWidth, "x", videoRef.current?.videoHeight);
          console.log("📹 Video ready state:", videoRef.current?.readyState);

          // Ensure video is actually playing before starting scan
          videoRef.current?.play().then(() => {
            console.log("▶️ Video started playing");
            setIsScanning(true);
            setDebugInfo("Camera active - position QR code in view");
          }).catch(err => {
            console.error("❌ Failed to start video playback:", err);
            setError("Failed to start camera preview");
          });
        };

        // Add error handler for video
        videoRef.current.onerror = (e) => {
          console.error("❌ Video element error:", e);
          setError("Camera preview failed to load");
        };
      }
    } catch (err: any) {
      console.error("Camera start error:", err);
      setError(`Camera error: ${err.message || 'Unknown error'}. Please check permissions and try again.`);
      setDebugInfo("");
      setScanMode('none');
    }
  };

  // Stop camera and cleanup (matching CreateOrderQRCode.tsx)
  const stopCamera = () => {
    console.log("Stopping camera...");

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log("Stopping track:", track.kind);
        track.stop();
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
    setScanMode('none');
    setDebugInfo("");
  };

  // Real-time QR code scanning from video stream (matching CreateOrderQRCode.tsx)
  const scanQRFromVideo = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning || scanMode !== 'live') {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    console.log("🔍 Scanning frame - Video state:", video.readyState, "Dimensions:", video.videoWidth, "x", video.videoHeight);

    // Check if video is ready
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      console.log("⏳ Video not ready, state:", video.readyState);
      return;
    }

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.log("📏 Video dimensions not set:", video.videoWidth, "x", video.videoHeight);
      return;
    }

    try {
      // Get or create canvas context
      let context = canvas.getContext("2d");
      if (!context) {
        console.error("❌ Canvas context not available");
        return;
      }

      // Set canvas dimensions to match video (only if different)
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        console.log("📐 Canvas resized to:", canvas.width, "x", canvas.height);
      }

      // Clear canvas first
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Draw current video frame
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      if (!imageData || !imageData.data) {
        console.error("❌ Failed to get image data from canvas");
        return;
      }

      console.log("🔍 Processing image data:", imageData.width, "x", imageData.height, "length:", imageData.data.length);

      // Test if jsQR is available and working
      if (typeof jsQR !== 'function') {
        console.error("❌ jsQR is not a function! Library not loaded properly.");
        setError("QR scanning library not loaded. Please refresh the page.");
        return;
      }

      // Try to detect QR code with multiple options
      let code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert"
      });

      // If no code found, try with inversion attempts
      if (!code) {
        console.log("🔄 Trying with inversion attempts...");
        code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "attemptBoth"
        });
      }

      // If still no code, try different processing
      if (!code) {
        console.log("🔄 Trying different processing method...");
        // Create a smaller canvas for testing
        const testCanvas = document.createElement('canvas');
        const testCtx = testCanvas.getContext('2d');
        if (testCtx) {
          testCanvas.width = Math.floor(imageData.width / 2);
          testCanvas.height = Math.floor(imageData.height / 2);
          testCtx.drawImage(canvas, 0, 0, testCanvas.width, testCanvas.height);

          const testImageData = testCtx.getImageData(0, 0, testCanvas.width, testCanvas.height);
          code = jsQR(testImageData.data, testImageData.width, testImageData.height, {
            inversionAttempts: "attemptBoth"
          });
        }
      }

      if (code) {
        console.log("🎉 QR Code detected:", code.data);
        handleQRCodeSuccess(code.data);
      } else {
        console.log("👀 No QR code found in frame - will retry...");
      }
    } catch (error) {
      console.error("💥 Error during QR scanning:", error);
    }
  };

  // Handle successful QR code detection (matching CreateOrderQRCode.tsx)
  const handleQRCodeSuccess = (qrData: string) => {
    console.log("✅ QR Code detected:", qrData);

    // Set scanned invoice (this will trigger the search logic)
    setScannedInvoice(qrData);
    setScanSuccess(true);
    setDebugInfo(`✅ QR Code detected: ${qrData.substring(0, 20)}...`);

    // Stop camera after successful scan (matching CreateOrderQRCode.tsx)
    stopCamera();

    // Haptic feedback on mobile (matching CreateOrderQRCode.tsx)
    if (isMobile() && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }

    // Clear success message after delay (matching CreateOrderQRCode.tsx)
    setTimeout(() => {
      setScanSuccess(false);
      setDebugInfo("");
    }, 3000);
  };

  const handleError = (errorMessage: string) => {
    console.error("QR Scanner Error:", errorMessage);
    setError(errorMessage);
    setIsScanning(false);
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
    if (isScanning) {
      setScanMode('live');
      setIsScanning(true);
      setDebugInfo("Switching camera...");
    }
  };

  const toggleScanMode = () => {
    setScanMode(prev => prev === 'live' ? 'capture' : 'live');
  };



  // Real-time QR scanning loop (matching CreateOrderQRCode.tsx)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isScanning && scanMode === 'live') {
      console.log("Starting QR scanning loop...");

      // Start scanning after video is ready
      const startScanning = () => {
        console.log("Setting up scan interval...");
        interval = setInterval(() => {
          scanQRFromVideo();
        }, 200); // Scan every 200ms
      };

      // Wait for video to be ready, then start scanning
      const timeout = setTimeout(startScanning, 1500);

      return () => {
        console.log("Cleaning up scan interval...");
        clearTimeout(timeout);
        if (interval) clearInterval(interval);
      };
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isScanning, scanMode]);

  // Process invoice number from QR code
  const processInvoiceNumber = (invoiceNumber: string) => {
    // Extract invoice number from URL if needed
    try {
      const url = new URL(invoiceNumber);
      const params = new URLSearchParams(url.search);
      const invoiceParam = params.get('invoice') || params.get('id') || params.get('invoice_number');
      if (invoiceParam) {
        setScannedInvoice(invoiceParam);
        return;
      }
    } catch (e) {
      // Not a URL, use as is
    }
    
    // Use the scanned text directly
    setScannedInvoice(invoiceNumber);
  };

  // Search for existing order and create search result in QROrderSearch table
  const searchOrder = async (invoiceNumber: string) => {
    if (!invoiceNumber) return;

    setSearching(true);
    setError(null);
    setSuccess(null);
    setOrderExists(null);

    try {
      // Check if this is a repeated search for the same invoice
      if (searchedInvoice === invoiceNumber) {
        // Compare against local orders list to determine if it exists
        const matchingOrder = orders.find(order =>
          order.invoice_number.toLowerCase() === invoiceNumber.toLowerCase()
        );

        if (matchingOrder) {
          setSuccess("Already Confirmed");
          setOrderExists(true);
        } else {
          setError("No Item Found");
          setOrderExists(false);
        }
      } else {
        setSearchedInvoice(invoiceNumber);

        // Compare against local orders list to check if invoice exists
        const matchingOrder = orders.find(order =>
          order.invoice_number.toLowerCase() === invoiceNumber.toLowerCase()
        );

        setOrderExists(!!matchingOrder);

        if (matchingOrder) {
          setSuccess("Confirm");
          // Save search result to QROrderSearch table with confirmed status
          await saveSearchResult(invoiceNumber, 'confirmed', 'Confirmed order found in system');
        } else {
          setError("No Confirm");
          // Save search result to QROrderSearch table with no_confirm status
          await saveSearchResult(invoiceNumber, 'no_confirm', 'Order not found in system');
        }
      }
    } catch (err: any) {
      console.error("Error searching invoice:", err);
      setError("Failed to search invoice. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  // Save search result to QROrderSearch table
  const saveSearchResult = async (invoiceNumber: string, status: 'confirmed' | 'no_confirm', note: string) => {
    try {
      const searchResult = await api.post('/qr-order-searches/', {
        invoice_number: invoiceNumber,
        status: status,
        note: note
      });

      console.log("Search result saved:", searchResult.data);

      // Navigate to submit page with appropriate status
      const statusParam = status === 'confirmed' ? 'confirm' : 'no-confirm';
      setTimeout(() => {
        navigate(`/qr-orders/submit?invoice=${invoiceNumber}&status=${statusParam}&searchId=${searchResult.data.id}`);
      }, 1500);

      return searchResult.data;
    } catch (error) {
      console.error("Error saving search result:", error);
      throw error;
    }
  };


  // Handle image upload for QR code scanning
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImagePreview(event.target.result as string);
          scanQRFromImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Scan QR code from uploaded image
  const scanQRFromImage = (imageSrc: string) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          processInvoiceNumber(code.data);
        } else {
          setError("No QR code found in the image. Please try another image.");
        }
      }
    };
    img.src = imageSrc;
  };

  // Clear image preview
  const clearImagePreview = () => {
    setImagePreview(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => navigate(user?.role === "admin" ? "/dashboard" : "/qr-orders/list")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">QR Order Search</h1>
            <p className="text-muted-foreground">Scan or search for QR orders when goods arrive</p>
          </div>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Scan className="h-5 w-5" />
              <span>Scan QR Code</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Hidden canvas for QR code processing */}
            <canvas ref={canvasRef} className="hidden" />
            
            {isScanning ? (
              <div className="space-y-4">
                {/* LIVE SCANNING ACTIVE indicator (matching CreateOrderQRCode.tsx) */}
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-red-600">🔴 LIVE SCANNING ACTIVE</span>
                </div>

                {/* Debug info for troubleshooting */}
                {debugInfo && (
                  <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
                    Debug: {debugInfo}
                  </div>
                )}

                {/* Scanning indicator */}
                <div className="flex items-center justify-center space-x-2 text-sm text-blue-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Scanning for QR codes...</span>
                </div>

                {/* Test button for debugging */}
                <div className="flex justify-center">
                  <Button
                    onClick={() => {
                      console.log("🧪 Manual scan test triggered");
                      scanQRFromVideo();
                    }}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    🔍 Test Scan
                  </Button>
                </div>

                {/* Fullscreen overlay for mobile */}
                {scanMode === 'capture' && (
                  <div className="fixed inset-0 z-50 bg-black">
                    <div className="relative w-full h-full">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      {/* QR Code positioning guide */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="border-2 border-white border-dashed rounded-lg w-3/4 h-3/4 flex items-center justify-center">
                          <div className="text-white text-center bg-black bg-opacity-50 rounded px-2 py-1">
                            <QrCode className="h-6 w-6 mx-auto mb-1" />
                            <p className="text-xs">Position QR code here</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Regular camera view (EXACTLY matching CreateOrderQRCode.tsx) */}
                {scanMode === 'live' && (
                  <div className="relative aspect-square w-full max-w-sm mx-auto bg-black rounded-lg overflow-hidden border-2 border-blue-500">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                    {/* QR Code positioning guide (matching CreateOrderQRCode.tsx) */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="border-2 border-white border-dashed rounded-lg w-3/4 h-3/4 flex items-center justify-center">
                        <div className="text-white text-center bg-black bg-opacity-50 rounded px-2 py-1">
                          <QrCode className="h-6 w-6 mx-auto mb-1" />
                          <p className="text-xs">Position QR code here</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stop Camera button (matching CreateOrderQRCode.tsx) */}
                <div className="flex justify-center space-x-2">
                  <Button
                    onClick={stopCamera}
                    variant="outline"
                    className="border-red-500 text-red-600 hover:bg-red-50"
                  >
                    🛑 Stop Camera
                  </Button>
                </div>

                <p className="text-center text-sm text-muted-foreground">
                  Point your camera at a QR code. The system will automatically detect and capture it.
                </p>
              </div>
            ) : imagePreview ? (
              <div className="space-y-4">
                <div className="relative aspect-square w-full max-w-xs mx-auto bg-muted rounded-lg overflow-hidden">
                  <img 
                    src={imagePreview} 
                    alt="Uploaded QR code" 
                    className="w-full h-full object-contain"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={clearImagePreview}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-center text-muted-foreground">
                  Scanning QR code from image...
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Live Camera Option */}
                  <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Camera className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-blue-900">Live Camera Scan</h3>
                        <p className="text-sm text-blue-700 mt-1">Real-time scanning with camera preview</p>
                      </div>
                      <Button
                        onClick={() => {
                          setScanMode('live');
                          setIsScanning(true);
                          setError(null);
                          setDebugInfo("Initializing camera...");
                          // Actually start the camera
                          setTimeout(() => startLiveCameraScan(), 100);
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        Start Live Camera
                      </Button>
                    </div>
                  </div>

                  {/* Upload Image Option */}
                  <div className="border-2 border-dashed border-green-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <Upload className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-green-900">Upload Image</h3>
                        <p className="text-sm text-green-700 mt-1">Select an existing image from your device</p>
                      </div>
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <Upload className="mr-2 h-4 w-4" /> Upload Image
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="text-center text-sm text-muted-foreground space-y-2">
                  <p>💡 <strong>Tip:</strong> Use Live Camera for quick scanning or Upload Image for more control</p>

                  {/* Browser compatibility info */}
                  <div className="text-xs space-y-1">
                    <p className="text-blue-600">
                      📷 <strong>Live Camera:</strong> Opens your device's camera to scan QR codes in real-time
                    </p>
                    <p className="text-green-600">
                      📁 <strong>Upload Image:</strong> Select an existing image from your device
                    </p>
                    {isMobile() && (
                      <p className="text-purple-600">
                        📱 <strong>Mobile tip:</strong> Allow camera access when prompted for best results
                      </p>
                    )}
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  aria-label="Upload QR code image"
                  onChange={handleImageUpload}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Display scanned invoice number with success feedback */}
        {scannedInvoice && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Scanned Invoice</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Invoice Number</Label>
                    <p className="text-lg font-mono">{scannedInvoice}</p>
                  </div>
                  <Button
                    onClick={() => {
                      setScannedInvoice(null);
                      setOrderExists(null);
                      setError(null);
                      setSuccess(null);
                      setScanMode('live');
                      setIsScanning(true);
                      setDebugInfo("Initializing camera...");
                      // Actually start the camera for rescan
                      setTimeout(() => startLiveCameraScan(), 100);
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Rescan
                  </Button>
                </div>

                {/* Success message */}
                {scanSuccess && (
                  <div className="flex items-center space-x-2 text-green-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">QR Code scanned successfully!</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Search Order</CardTitle>
            <CardDescription>
              Search for an order by scanned invoice number
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => {
                if (scannedInvoice) {
                  searchOrder(scannedInvoice);
                }
              }}
              className="w-full"
              disabled={searching || !scannedInvoice}
            >
              {searching ? "Searching..." : "Search Order"}
            </Button>
          </CardContent>
        </Card>

        {/* Status Messages */}
        {error && !success && (
          <Card className="shadow-card border-destructive">
            <CardContent className="p-6">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
        
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
      </div>
    </Layout>
  );
};

export default CreateOrderQRCodeSearch;
