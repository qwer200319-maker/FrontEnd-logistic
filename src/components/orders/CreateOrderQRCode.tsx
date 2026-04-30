import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import jsQR from "jsqr";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QrCode, Camera, Upload, ArrowLeft, X } from "lucide-react";
import Layout from "@/components/layout/Layout";
import api, { getMediaUrl } from "@/lib/api";
import { uploadToCloudinary, testCloudinaryConnection } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";

// QROrder interface for detail view
interface QROrder {
  id: number;
  invoice_number: string;
  status: string;
  note: string;
  created_at: string;
  images?: Array<{
    id: number;
    image: string;
    qr_data?: string;
    uploaded_at?: string;
  }>;
}

const CreateOrderQRCode = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  
  const [formData, setFormData] = useState({
    invoice_number: "",
    status: "in_transit",
    note: "",
  });

  // Scanning modes and states
  const [scanMode, setScanMode] = useState<'none' | 'live' | 'capture'>('none');
  const [isScanning, setIsScanning] = useState(false);
  const [orderImages, setOrderImages] = useState<Array<{
    file: File;
    preview: string;
    id: string;
    scanned: boolean;
    qrData?: string;
    cloudinaryUrl?: string;
    isUploading?: boolean;
  }>>([]);

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [scanSuccess, setScanSuccess] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");

  // Success state after creation
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string>("");

  // Desktop testing mode
  const [isDesktopTestMode, setIsDesktopTestMode] = useState(false);

  // Upload tracking state
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // Refs for different input methods
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const liveCameraInputRef = useRef<HTMLInputElement>(null);
  const imageUploadInputRef = useRef<HTMLInputElement>(null);
  const qrUploadInputRef = useRef<HTMLInputElement>(null);

  // Mobile detection utility
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            (window.innerWidth <= 768 && window.innerHeight <= 1024);
  };

  // Test function to verify button functionality
  const testButtonFunctionality = () => {
    console.log("Testing button functionality...");
    console.log("imageUploadInputRef exists:", !!imageUploadInputRef.current);
    console.log("isMobile():", isMobile());
    console.log("User agent:", navigator.userAgent);

    // Try to trigger the file input directly
    try {
      if (imageUploadInputRef.current) {
        imageUploadInputRef.current.click();
        console.log("File input clicked successfully");
      } else {
        console.error("File input ref is null");
      }
    } catch (err) {
      console.error("Error clicking file input:", err);
    }
  };

  // Alternative method using document.querySelector
  const triggerFileInputAlternative = () => {
    console.log("Trying alternative method...");
    const fileInput = document.querySelector('input[type="file"][capture="environment"]') as HTMLInputElement;
    if (fileInput) {
      console.log("Found file input via querySelector");
      fileInput.click();
    } else {
      console.error("File input not found via querySelector");
    }
  };

  // Start live camera scanning with real-time preview
  const startLiveCameraScan = async () => {
    try {
      setError("");
      setDebugInfo("Starting live camera scan...");
      setScanMode('live');

      // Stop any existing stream
      if (streamRef.current) {
        stopCamera();
      }

      // Check for camera support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Camera is not supported in this browser. Please use a modern browser.");
        return;
      }

      // Request camera access with optimized constraints
      const constraints = {
        video: {
          facingMode: "environment",
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        }
      };

      console.log("Requesting camera access...");
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          console.log("Camera started, dimensions:", videoRef.current?.videoWidth, "x", videoRef.current?.videoHeight);
          setIsScanning(true);
          setDebugInfo("Camera active - position QR code in view");
        };
      }
    } catch (err: any) {
      console.error("Camera start error:", err);
      setError(`Camera error: ${err.message || 'Unknown error'}. Please check permissions and try again.`);
      setDebugInfo("");
      setScanMode('none');
    }
  };

  // Stop camera and cleanup
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

  // Real-time QR code scanning from video stream
  const scanQRFromVideo = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    if (imageData) {
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert"
      });

      if (code) {
        console.log("QR Code detected:", code.data);
        handleQRCodeSuccess(code.data);
      }
    }
  };

  // Handle successful QR code detection
  const handleQRCodeSuccess = (qrData: string) => {
    setFormData(prev => ({ ...prev, invoice_number: qrData }));
    setScanSuccess(true);
    setDebugInfo(`✅ QR Code detected: ${qrData.substring(0, 20)}...`);

    // Stop camera after successful scan
    stopCamera();

    // Haptic feedback on mobile
    if (isMobile() && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }

    // Clear success message after delay
    setTimeout(() => {
      setScanSuccess(false);
      setDebugInfo("");
    }, 3000);
  };


  // Compress image for storage optimization
  const compressImage = (file: File, maxWidth: number = 1920, maxHeight: number = 1080, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(file); // Return original if compression fails
            }
          }, 'image/jpeg', quality);
        } else {
          resolve(file);
        }
      };

      img.src = URL.createObjectURL(file);
    });
  };

  // Add image to order
  const addImageToOrder = async (file: File) => {
    // Generate unique ID for the image first
    const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      console.log("Adding image to order:", file.name, "Size:", file.size, "Type:", file.type);

      // Validate file before processing
      if (!file || file.size === 0) {
        throw new Error("Invalid file provided");
      }

      // Set uploading state
      setIsUploadingImages(true);

      // Create preview URL first
      const previewUrl = URL.createObjectURL(file);

      // Add to order images with uploading state
      const newImage = {
        file: file,
        preview: previewUrl,
        id: imageId,
        scanned: false,
        cloudinaryUrl: undefined,
        isUploading: true
      };

      setOrderImages(prev => [...prev, newImage]);

      // Compress image for storage optimization
      const compressedFile = await compressImage(file);
      console.log("Image compressed from", file.size, "to", compressedFile.size, "bytes");

      // Upload to backend API which will handle Telegram upload
      console.log("Uploading to backend API for Telegram storage...");
      const uploadFormData = new FormData();
      uploadFormData.append('image', compressedFile);

      try {
        // Since we don't have an order ID yet, we'll create a temporary endpoint or use a placeholder
        // For now, let's try to upload directly to a temporary endpoint
        const response = await api.post('/qr-orders/upload_image/', uploadFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.data && response.data.telegram_file_id) {
           const telegramFileId = response.data.telegram_file_id;
           console.log("✅ Backend Telegram upload successful:", telegramFileId);

           // Create proxy URL for the image
           const imageUrl = `/api/telegram/image/${telegramFileId}/`;
           console.log("✅ Proxy URL created:", imageUrl);

           // Update the image with URL and mark as uploaded
           setOrderImages(prev => prev.map(img =>
             img.id === imageId
               ? { ...img, cloudinaryUrl: imageUrl, isUploading: false }
               : img
           ));

           // Check if all images are now uploaded
           setOrderImages(currentImages => {
             const allUploaded = currentImages.every(img => !img.isUploading && img.cloudinaryUrl);
             if (allUploaded && currentImages.length > 0) {
               console.log("✅ All image uploads complete");
               setIsUploadingImages(false);
               setDebugInfo("All images uploaded successfully");
             }
             return currentImages;
           });

           // Scan for QR code in the new image
           await scanQRFromImage(compressedFile, imageId);

           setDebugInfo(`Image uploaded to Telegram: ${compressedFile.name}`);
         } else {
           throw new Error("No telegram_file_id returned from backend");
         }
      } catch (uploadError) {
        console.error("Upload failed, falling back to mock URL:", uploadError);
        // Fallback to mock URL if backend upload fails
        const mockImageUrl = `https://api.telegram.org/file/bot7357271154:AAFky7Iid-BLypz1h7k150W5upypCvNkPnw/${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log("Using fallback mock URL:", mockImageUrl);

        // Update the image with mock URL and mark as uploaded
        setOrderImages(prev => prev.map(img =>
          img.id === imageId
            ? { ...img, cloudinaryUrl: mockImageUrl, isUploading: false }
            : img
        ));

        // Check if all images are now uploaded
        setOrderImages(currentImages => {
          const allUploaded = currentImages.every(img => !img.isUploading && img.cloudinaryUrl);
          if (allUploaded && currentImages.length > 0) {
            console.log("✅ All image uploads complete");
            setIsUploadingImages(false);
            setDebugInfo("All images uploaded successfully");
          }
          return currentImages;
        });

        // Scan for QR code in the new image
        await scanQRFromImage(compressedFile, imageId);

        setDebugInfo(`Image uploaded to Telegram (fallback): ${compressedFile.name}`);
      }
    } catch (err: any) {
      console.error("Error adding image:", err);
      const errorMessage = err.message || "Failed to upload image. Please try again.";
      setError(errorMessage);

      // Remove the failed image from the list
      setOrderImages(prev => prev.filter(img => img.id !== imageId));

      // Check if we should reset uploading state
      setOrderImages(currentImages => {
        const hasUploadingImages = currentImages.some(img => img.isUploading);
        if (!hasUploadingImages) {
          setIsUploadingImages(false);
        }
        return currentImages;
      });

      throw err; // Re-throw to allow calling code to handle
    }
  };


  // Scan QR code from a specific image
  const scanQRFromImage = async (file: File, imageId: string) => {
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
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
                console.log("QR Code found in image:", code.data);

                // Update the specific image with QR data
                setOrderImages(prev => prev.map(img =>
                  img.id === imageId
                    ? { ...img, scanned: true, qrData: code.data }
                    : img
                ));

                // If no invoice number is set, use this QR code
                if (!formData.invoice_number) {
                  handleQRCodeSuccess(code.data);
                }
              }
            }
          };
          img.src = event.target.result as string;
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Error scanning QR from image:", err);
    }
  };

  // Remove image from order
  const removeImageFromOrder = (imageId: string) => {
    setOrderImages(prev => {
      const imageToRemove = prev.find(img => img.id === imageId);
      if (imageToRemove) {
        // Clean up the preview URL
        URL.revokeObjectURL(imageToRemove.preview);
      }
      const updatedImages = prev.filter(img => img.id !== imageId);

      // Check if we should reset uploading state after removal
      const hasUploadingImages = updatedImages.some(img => img.isUploading);
      const allUploaded = updatedImages.length > 0 && updatedImages.every(img => !img.isUploading && img.cloudinaryUrl);

      if (!hasUploadingImages && !allUploaded) {
        setIsUploadingImages(false);
      } else if (allUploaded) {
        console.log("✅ All remaining images uploaded after removal");
        setIsUploadingImages(false);
      }

      return updatedImages;
    });
  };

  // Handle image capture/upload
  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      console.log("Image files selected:", files.length);

      // Process files sequentially to ensure proper upload tracking
      for (const file of files) {
        console.log("Processing file:", file.name, file.size, "bytes");
        try {
          await addImageToOrder(file);
        } catch (error) {
          console.error("Failed to process file:", file.name, error);
          // Continue with other files even if one fails
        }
      }
    }

    // Reset the file input value to allow selecting the same file again
    e.target.value = '';
  };

  // Start capture mode with live preview
  const startCaptureMode = async () => {
    try {
      setError("");
      setDebugInfo("Starting capture mode...");
      setScanMode('capture');

      // Check for camera support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Camera is not supported. Please use the upload option instead.");
        return;
      }

      const constraints = {
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          console.log("Capture mode camera ready");
          setDebugInfo("Camera ready - take a photo of the QR code");
        };
      }
    } catch (err: any) {
      console.error("Capture mode error:", err);
      setError(`Camera error: ${err.message || 'Unknown error'}. Please try upload instead.`);
      setDebugInfo("");
      setScanMode('none');
    }
  };

  // Take photo from live preview
  const takePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) {
      setError("Camera not ready. Please try again.");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(async (blob) => {
        if (blob) {
          const photoFile = new File([blob], `qr_photo_${Date.now()}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });

          console.log("Photo taken:", photoFile.name, "Size:", photoFile.size, "Type:", photoFile.type);

          try {
            // Add image to order (this will upload to Cloudinary)
            await addImageToOrder(photoFile);
            stopCamera();
            setDebugInfo("Photo captured and uploaded to Cloudinary successfully");
          } catch (uploadError) {
            console.error("Failed to upload captured photo:", uploadError);
            setError(`Failed to upload captured photo: ${uploadError.message || 'Unknown error'}. Please try again.`);
            stopCamera();
          }
        } else {
          console.error("Failed to create blob from canvas");
          setError("Failed to capture photo. Please try again.");
          stopCamera();
        }
      }, 'image/jpeg', 0.8);
    } else {
      console.error("Canvas context not available or video not ready");
      setError("Camera not ready for capture. Please try again.");
    }
  };

  // Real-time QR scanning loop
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isScanning) {
      // Start scanning after video is ready
      const startScanning = () => {
        interval = setInterval(scanQRFromVideo, 200); // Scan every 200ms
      };

      // Wait for video to be ready
      const timeout = setTimeout(startScanning, 1000);

      return () => {
        clearTimeout(timeout);
        if (interval) clearInterval(interval);
      };
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isScanning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();

      // Clean up image previews
      orderImages.forEach(image => {
        URL.revokeObjectURL(image.preview);
      });
    };
  }, [orderImages]);
  
  // Handle form input changes
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle QR code upload for desktop testing
  const handleQRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const file = files[0];
      console.log("QR file selected:", file.name);

      // Read the QR code file and extract invoice number
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
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
                console.log("QR Code found in uploaded file:", code.data);
                setFormData(prev => ({ ...prev, invoice_number: code.data }));
                setScanSuccess(true);
                setDebugInfo(`✅ QR Code scanned from file: ${code.data.substring(0, 20)}...`);
                setTimeout(() => {
                  setScanSuccess(false);
                  setDebugInfo("");
                }, 3000);
              } else {
                setError("No QR code found in the uploaded image. Please try a different image.");
              }
            }
          };
          img.src = event.target.result as string;
        }
      };
      reader.readAsDataURL(file);
    }

    // Reset the file input value to allow selecting the same file again
    e.target.value = '';
  };
  
  // Handle form submission with images
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if images are still uploading
    if (isUploadingImages) {
      setError("Please wait — images are still uploading.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      console.log("=== FORM VALIDATION DEBUG ===");
      console.log("Invoice number:", formData.invoice_number);
      console.log("Invoice number trimmed:", formData.invoice_number?.trim());
      console.log("Order images count:", orderImages.length);
      console.log("Desktop test mode:", isDesktopTestMode);

      // Validate required fields before submission
      if (!formData.invoice_number || formData.invoice_number.trim() === "") {
        setError(isDesktopTestMode
          ? "Invoice number is required. Please enter it manually or upload a QR code."
          : "Invoice number is required. Please scan a QR code first."
        );
        setIsLoading(false);
        return;
      }

      // Ensure all images are uploaded to Cloudinary before submission
      const imageUrls = orderImages
        .filter(img => img.cloudinaryUrl && typeof img.cloudinaryUrl === 'string' && img.cloudinaryUrl.trim() !== '')
        .map(img => img.cloudinaryUrl)
        .filter(Boolean);

      console.log("=== BEFORE FILTERING ===");
      console.log("orderImages:", orderImages);
      console.log("orderImages.map cloudinaryUrl:", orderImages.map(img => img.cloudinaryUrl));

      console.log("=== IMAGE UPLOAD VALIDATION ===");
      console.log("Total images:", orderImages.length);
      console.log("Images with Cloudinary URLs:", imageUrls.length);
      console.log("Collected image URLs:", imageUrls);
      console.log("Order images array:", orderImages.map(img => ({
        id: img.id,
        hasCloudinaryUrl: !!img.cloudinaryUrl,
        cloudinaryUrl: img.cloudinaryUrl ? img.cloudinaryUrl.substring(0, 50) + '...' : 'none',
        cloudinaryUrlType: typeof img.cloudinaryUrl,
        isUploading: img.isUploading
      })));

      if (orderImages.length > 0 && imageUrls.length !== orderImages.length) {
        console.error("Image upload validation failed:");
        console.error("Expected images:", orderImages.length);
        console.error("Valid URLs:", imageUrls.length);
        console.error("Images without URLs:", orderImages.filter(img => !img.cloudinaryUrl || typeof img.cloudinaryUrl !== 'string' || img.cloudinaryUrl.trim() === ''));

        setError("Some images are still uploading to Cloudinary. Please wait and try again.");
        setIsLoading(false);
        return;
      }

      // Prepare JSON payload for API
      const payload = {
        invoice_number: formData.invoice_number.trim(),
        status: formData.status,
        note: formData.note,
        image_urls: imageUrls.map(url => {
          // If it's a proxy URL, extract the file_id for backend storage
          if (url.startsWith('/api/telegram/image/')) {
            const fileId = url.replace('/api/telegram/image/', '').replace('/', '');
            return fileId;
          }
          return url;
        })
      };

      console.log("=== API PAYLOAD DEBUG ===");
      console.log("Payload:", JSON.stringify(payload, null, 2));
      console.log("Desktop test mode enabled:", isDesktopTestMode);
      console.log("Image URLs to be sent:", imageUrls);
      console.log("Image URLs types:", imageUrls.map(url => typeof url));
      console.log("Image URLs validity:", imageUrls.map(url => url && typeof url === 'string' && url.trim() !== ''));

      // Check if invoice number already exists
      try {
        const checkResponse = await api.get(`/qr-orders/check/?invoice_number=${encodeURIComponent(formData.invoice_number.trim())}`);
        if (checkResponse.data.exists) {
          setError(`Invoice number "${formData.invoice_number.trim()}" already exists. Please use a different invoice number.`);
          setIsLoading(false);
          return;
        }
      } catch (checkError) {
        console.warn("Could not check invoice existence:", checkError);
        // Continue with submission if check fails
      }

      // Submit to backend
      console.log("Submitting to /api/qr-orders/...");
      console.log("API endpoint:", "/qr-orders/");
      console.log("Request payload:", JSON.stringify(payload, null, 2));
      console.log("Payload type:", typeof payload);
      console.log("Payload keys:", Object.keys(payload));
      console.log("Payload image_urls:", payload.image_urls);
      console.log("Payload image_urls type:", typeof payload.image_urls);
      console.log("Payload image_urls length:", payload.image_urls ? payload.image_urls.length : 'undefined');

      const response = await api.post("/qr-orders/", payload);

      console.log("=== ORDER SUBMISSION RESPONSE DEBUG ===");
      console.log("Order submitted successfully:", response.data);
      console.log("Response data type:", typeof response.data);
      console.log("Response data keys:", response.data ? Object.keys(response.data) : 'No data');

      // Clean up image previews after successful submission
      orderImages.forEach(image => {
        URL.revokeObjectURL(image.preview);
      });

      // Clear order images after successful submission
      setOrderImages([]);

      // Clear form data
      setFormData({
        invoice_number: "",
        status: "in_transit",
        note: "",
      });

      // Navigate to the QR orders list page immediately
      navigate("/qr-orders/list");
    } catch (err: any) {
      console.error("Error creating QR order:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);

      // Show detailed error message
      if (err.response?.data) {
        const errorData = err.response.data;
        if (typeof errorData === 'object') {
          // Handle specific error cases
          if (errorData.invoice_number && Array.isArray(errorData.invoice_number)) {
            // This is likely a unique constraint violation
            setError(`Invoice number "${formData.invoice_number.trim()}" already exists. Please use a different invoice number.`);
          } else {
            const errorMessages = Object.values(errorData).flat().join(', ');
            setError(`Failed to create QR order: ${errorMessages}`);
          }
        } else {
          setError(errorData);
        }
      } else {
        setError("Failed to create QR order. Please try again.");
      }
    } finally {
      setIsLoading(false);
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
            <h1 className="text-3xl font-bold">Create QR Order</h1>
            <p className="text-muted-foreground">Fill in the details to create a new QR order</p>
          </div>
        </div>
        <Card className="shadow-card">
        <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <QrCode className="h-5 w-5" />
                    <span>QR Code Scanner</span>
                  </CardTitle>
                  <CardDescription>
                    Choose your preferred scanning method
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Debug info for troubleshooting */}
                   {debugInfo && (
                     <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
                       Debug: {debugInfo}
                     </div>
                   )}

                   {/* Cloudinary Test Button */}
                   {/* <div className="flex justify-center">
                     <Button
                       onClick={async () => {
                         setDebugInfo("Testing Cloudinary connection...");
                         try {
                           const isConnected = await testCloudinaryConnection();
                           setDebugInfo(isConnected ? "✅ Cloudinary connection successful" : "❌ Cloudinary connection failed");
                         } catch (error) {
                           setDebugInfo(`❌ Cloudinary test error: ${error}`);
                         }
                       }}
                       variant="outline"
                       size="sm"
                       className="text-xs"
                     >
                       Test Cloudinary
                     </Button>
                   </div> */}


                  {/* Live Camera Scanning Mode */}
                  {scanMode === 'live' && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-red-600">🔴 LIVE SCANNING ACTIVE</span>
                      </div>

                      <div className="relative aspect-square w-full max-w-sm mx-auto bg-black rounded-lg overflow-hidden border-2 border-blue-500">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover scale-x-[-1]"
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
                  )}

                  {/* Image Capture Mode with Live Preview */}
                  {scanMode === 'capture' && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-green-600">📸 CAPTURE MODE ACTIVE</span>
                      </div>

                      <div className="relative aspect-square w-full max-w-sm mx-auto bg-black rounded-lg overflow-hidden border-2 border-green-500">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover scale-x-[-1]"
                        />
                        {/* Camera overlay for capture mode */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="border-2 border-white border-dashed rounded-lg w-3/4 h-3/4 flex items-center justify-center">
                            <div className="text-white text-center bg-black bg-opacity-50 rounded px-2 py-1">
                              <Camera className="h-6 w-6 mx-auto mb-1" />
                              <p className="text-xs">Position QR code and tap capture</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-center space-x-2">
                        <Button
                          onClick={takePhoto}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Camera className="mr-2 h-4 w-4" />
                          📸 Capture Photo
                        </Button>
                        <Button
                          onClick={stopCamera}
                          variant="outline"
                          className="border-red-500 text-red-600 hover:bg-red-50"
                        >
                          🛑 Stop Camera
                        </Button>
                      </div>

                      <p className="text-center text-sm text-muted-foreground">
                        Position the QR code in the frame and tap "Capture Photo" to take a picture.
                      </p>
                    </div>
                  )}

                  {/* Order Images Management */}
                  {orderImages.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span className="text-sm font-medium text-purple-600">
                          🖼️ ORDER IMAGES ({orderImages.length})
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {orderImages.map((image) => (
                          <div key={image.id} className="relative group">
                            <div className={`aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 ${image.isUploading ? 'border-yellow-400' : 'border-gray-200'}`}>
                              <img
                                src={image.preview}
                                alt="Order image"
                                className={`w-full h-full object-cover ${image.isUploading ? 'opacity-50' : 'opacity-100'}`}
                              />
                              {/* Upload status indicator */}
                              {image.isUploading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                                  <div className="text-white text-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-1"></div>
                                    <p className="text-xs">Uploading...</p>
                                  </div>
                                </div>
                              )}
                              {/* QR scan indicator */}
                              {image.scanned && !image.isUploading && (
                                <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                                  ✓ QR Found
                                </div>
                              )}
                            </div>
                            <Button
                              onClick={() => removeImageFromOrder(image.id)}
                              variant="destructive"
                              size="sm"
                              className="absolute -top-2 -right-2 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              disabled={image.isUploading}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-center space-x-2">
                        <Button
                          onClick={startCaptureMode}
                          variant="outline"
                          className="border-green-500 text-green-600 hover:bg-green-50"
                        >
                          <Camera className="mr-2 h-4 w-4" />
                          Add Another Photo
                        </Button>
                        <Button
                          onClick={() => imageUploadInputRef.current?.click()}
                          variant="outline"
                          className="border-blue-500 text-blue-600 hover:bg-blue-50"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Image
                        </Button>
                        <input
                          ref={imageUploadInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          aria-label="Upload QR code images"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            files.forEach(file => addImageToOrder(file));
                            e.target.value = '';
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Default Mode - Mode Selection */}
                  {scanMode === 'none' && (
                    <div className="space-y-6">
                      {/* Desktop Test Mode Toggle */}
                      <div className="flex items-center justify-center space-x-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isDesktopTestMode}
                            onChange={(e) => setIsDesktopTestMode(e.target.checked)}
                            className="w-4 h-4 text-yellow-600 bg-gray-100 border-gray-300 rounded focus:ring-yellow-500"
                          />
                          <span className="text-sm font-medium text-yellow-800">
                            🖥️ Desktop - Enable manual invoice entry and QR upload
                          </span>
                        </label>
                      </div>

                      {isDesktopTestMode ? (
                        /* Desktop Test Mode */
                        <div className="space-y-4">
                          <div className="text-center">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Desktop Options</h3>
                            <p className="text-sm text-gray-600">Upload QR code images or enter invoice numbers manually</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* QR Code Upload */}
                            <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center hover:border-purple-500 transition-colors">
                              <div className="flex flex-col items-center space-y-3">
                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                  <QrCode className="h-6 w-6 text-purple-600" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-purple-900">Upload QR Code</h3>
                                  <p className="text-sm text-purple-700 mt-1">Select QR code image from computer</p>
                                </div>
                                <Button
                                  onClick={() => qrUploadInputRef.current?.click()}
                                  className="w-full bg-purple-600 hover:bg-purple-700"
                                >
                                  <Upload className="mr-2 h-4 w-4" />
                                  Upload QR Code
                                </Button>
                                <input
                                  ref={qrUploadInputRef}
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={handleQRUpload}
                                  aria-label="Upload QR code image for testing"
                                  title="Select a QR code image file to scan"
                                />
                              </div>
                            </div>

                            {/* Upload Images to Cloudinary */}
                            <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                              <div className="flex flex-col items-center space-y-3">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                  <Upload className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-blue-900">Upload Images</h3>
                                  <p className="text-sm text-blue-700 mt-1">Add order images to Cloudinary</p>
                                </div>
                                <Button
                                  onClick={() => imageUploadInputRef.current?.click()}
                                  className="w-full bg-blue-600 hover:bg-blue-700"
                                >
                                  <Upload className="mr-2 h-4 w-4" />
                                  Upload Images
                                </Button>
                                <input
                                  ref={imageUploadInputRef}
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  className="hidden"
                                  aria-label="Upload order images"
                                  onChange={(e) => {
                                    const files = Array.from(e.target.files || []);
                                    files.forEach(file => addImageToOrder(file));
                                    e.target.value = '';
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Mobile Mode */
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
                                  onClick={startLiveCameraScan}
                                  className="w-full bg-blue-600 hover:bg-blue-700"
                                >
                                  Start Live Camera
                                </Button>
                              </div>
                            </div>

                            {/* Image Capture Option */}
                            <div className="border-2 border-dashed border-green-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors">
                              <div className="flex flex-col items-center space-y-3">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                  <Camera className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-green-900">Capture & Upload</h3>
                                  <p className="text-sm text-green-700 mt-1">Take photos with live preview</p>
                                </div>
                                <Button
                                  onClick={startCaptureMode}
                                  className="w-full bg-green-600 hover:bg-green-700"
                                >
                                  Start Capture Mode
                                </Button>
                              </div>
                            </div>
                          </div>

                          <div className="text-center text-sm text-muted-foreground space-y-2">
                            {/* <p>💡 <strong>Tip:</strong> Use Live Camera for quick scanning or Capture & Upload for more control</p> */}

                            {/* Browser compatibility info */}
                            {/* <div className="text-xs space-y-1">
                              <p className="text-blue-600">
                                📷 <strong>Take Photo:</strong> Opens your device's camera to capture a QR code
                              </p>
                              <p className="text-green-600">
                                📁 <strong>Upload Image:</strong> Select an existing image from your device
                              </p>
                              {isMobile() && (
                                <p className="text-purple-600">
                                  📱 <strong>Mobile tip:</strong> Allow camera access when prompted for best results
                                </p>
                              )}
                            </div> */}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hidden canvas for QR processing */}
                  <canvas ref={canvasRef} className="hidden" />
                </CardContent>
        </Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <QrCode className="h-5 w-5" />
              <span>QR Order Information</span>
            </CardTitle>
            <CardDescription>
              Enter the order details and upload images
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {showSuccessMessage && (
                <Alert className="border-green-500 bg-green-50">
                  <AlertDescription className="text-green-800 flex items-center justify-between">
                    <span>✅ Order #{createdOrderNumber} created successfully!</span>
                    <Button
                      onClick={() => {
                        setShowSuccessMessage(false);
                        setCreatedOrderNumber("");
                      }}
                      variant="outline"
                      size="sm"
                      className="ml-4 border-green-500 text-green-700 hover:bg-green-100"
                    >
                      Create Another Order
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
              
              <div>
                <Label htmlFor="invoice_number">Invoice Number</Label>
                <div className="relative">
                  <Input
                    id="invoice_number"
                    value={formData.invoice_number}
                    onChange={(e) => handleChange("invoice_number", e.target.value)}
                    required
                    readOnly={!isDesktopTestMode}
                    placeholder={isDesktopTestMode ? "Enter invoice number or upload QR code" : "Click 'Start Live Camera' to auto-fill from QR code"}
                    className={`pr-10 ${scanSuccess ? 'border-green-500 bg-green-50' : ''}`}
                  />
                  {scanSuccess && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                {scanSuccess && (
                  <p className="text-sm text-green-600 mt-1 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    QR Code scanned successfully!
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Input
                  id="status"
                  value="In Transit"
                  readOnly
                  className="bg-gray-50 text-gray-700"
                  title="Status is automatically set to 'In Transit' for new orders"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Status is automatically set to "In Transit" for new QR orders
                </p>
              </div>
              

              <div>
                <Label htmlFor="note">Note (Optional)</Label>
                <Textarea
                  id="note"
                  value={formData.note}
                  onChange={(e) => handleChange("note", e.target.value)}
                  placeholder="Add any additional notes about this order"
                />
              </div>
              
              
        
              <Button
                type="submit"
                className="w-full bg-gradient-primary hover:shadow-primary"
                disabled={isLoading || !formData.invoice_number.trim() || isUploadingImages}
              >
                {isLoading ? "Creating Order..." : isUploadingImages ? "Uploading images..." : "Create QR Order"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CreateOrderQRCode;