import { useState, useEffect, useRef } from "react";
import jsQR from "jsqr";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Camera, QrCode } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface QRScannerProps {
  onScanSuccess: (data: string) => void;
  onScanError?: (error: string) => void;
}

const QRScanner = ({ onScanSuccess, onScanError }: QRScannerProps) => {
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Function to start the camera
  const startCamera = async () => {
    try {
      if (streamRef.current) {
        stopCamera();
      }

      const constraints = {
        video: { facingMode: facingMode }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      handleError(err);
    }
  };

  // Function to stop the camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Function to capture and process frames
  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = context?.getImageData(0, 0, canvas.width, canvas.height);

      if (imageData) {
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code) {
          handleScan(code.data);
        }
      }
    }
  };

  const handleScan = (result: string) => {
    if (result) {
      setScannedResult(result);
      setIsScanning(false);
      onScanSuccess(result);
    }
  };

  const handleError = (err: any) => {
    console.error("QR Scanner Error:", err);
    let errorMessage = "Failed to access camera. Please ensure you've granted camera permissions.";
    
    if (err instanceof Error) {
      errorMessage = err.message;
    } else if (typeof err === 'string') {
      errorMessage = err;
    }
    
    setError(errorMessage);
    setIsScanning(false);
    onScanError?.(errorMessage);
  };

  const resetScanner = () => {
    setScannedResult(null);
    setIsScanning(true);
    setError(null);
    startCamera();
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
    resetScanner();
  };

  // Start camera when component mounts or when scanning is enabled
  useEffect(() => {
    if (isScanning) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isScanning, facingMode]);

  // Capture frames periodically when scanning
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isScanning) {
      interval = setInterval(captureFrame, 200);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isScanning]);

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <QrCode className="h-5 w-5" />
          <span>QR Code Scanner</span>
        </CardTitle>
        <CardDescription>
          Position the QR code within the frame to scan
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hidden canvas for QR code processing */}
        <canvas ref={canvasRef} style={{ display: "none" }} />
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {scannedResult ? (
          <div className="text-center py-4">
            <div className="bg-success-light p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h3 className="text-lg font-medium mb-2">Scan Successful</h3>
            <p className="text-muted-foreground mb-4">QR Code scanned successfully</p>
            <div className="bg-muted p-3 rounded-md text-sm font-mono break-words">
              {scannedResult}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative aspect-square w-full max-w-xs mx-auto bg-muted rounded-lg overflow-hidden">
              {isScanning ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Scanner paused</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-center space-x-2">
              <Button 
                onClick={resetScanner} 
                variant="outline"
                disabled={isScanning}
              >
                Rescan
              </Button>
              <Button 
                onClick={toggleCamera}
                variant="outline"
              >
                Switch Camera
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QRScanner;