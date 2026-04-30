import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from "qrcode.react";
import { 
  CreditCard, 
  QrCode, 
  CheckCircle, 
  Clock,
  Smartphone,
  Banknote
} from "lucide-react";

interface PaymentQRCodeProps {
  orderId: string;
  amount: number;
  paymentStatus: "paid" | "unpaid" | "pending";
  onPaymentComplete?: () => void;
}

const PaymentQRCode = ({ orderId, amount, paymentStatus, onPaymentComplete }: PaymentQRCodeProps) => {
  const [selectedMethod, setSelectedMethod] = useState<"aba" | "wing" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const generatePaymentQR = (method: "aba" | "wing") => {
    // Mock payment QR data - replace with actual payment gateway integration
    const paymentData = {
      orderId,
      amount,
      method,
      merchantId: method === "aba" ? "ABA-MERCHANT-123" : "WING-MERCHANT-456",
      timestamp: Date.now(),
    };
    
    return JSON.stringify(paymentData);
  };

  const handlePaymentMethodSelect = (method: "aba" | "wing") => {
    setSelectedMethod(method);
  };

  const simulatePayment = () => {
    setIsProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      onPaymentComplete?.();
    }, 3000);
  };

  if (paymentStatus === "paid") {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-success">
            <CheckCircle className="h-5 w-5" />
            <span>Payment Completed</span>
          </CardTitle>
          <CardDescription>
            Payment for order #{orderId} has been successfully processed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="bg-success-light p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h3 className="text-lg font-medium mb-2">Payment Successful</h3>
            <p className="text-muted-foreground mb-4">Amount: ${(amount || 0).toLocaleString()}</p>
            <Badge className="bg-success text-success-foreground">
              Paid via QR Code
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="h-5 w-5" />
          <span>Payment Options</span>
        </CardTitle>
        <CardDescription>
          Choose your preferred payment method to complete the order
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">Amount Due</p>
          <p className="text-3xl font-bold text-primary">${(amount || 0).toLocaleString()}</p>
        </div>

        {!selectedMethod && (
          <div className="space-y-3">
            <h4 className="font-medium">Select Payment Method:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2"
                onClick={() => handlePaymentMethodSelect("aba")}
              >
                <div className="bg-gradient-primary p-2 rounded-lg">
                  <QrCode className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="text-center">
                  <p className="font-medium">ABA Bank</p>
                  <p className="text-xs text-muted-foreground">Pay with ABA Mobile</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2"
                onClick={() => handlePaymentMethodSelect("wing")}
              >
                <div className="bg-gradient-success p-2 rounded-lg">
                  <Smartphone className="h-6 w-6 text-success-foreground" />
                </div>
                <div className="text-center">
                  <p className="font-medium">Wing Bank</p>
                  <p className="text-xs text-muted-foreground">Pay with Wing Mobile</p>
                </div>
              </Button>
            </div>
          </div>
        )}

        {selectedMethod && !isProcessing && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">
                {selectedMethod === "aba" ? "ABA Bank" : "Wing Bank"} Payment
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMethod(null)}
              >
                Change Method
              </Button>
            </div>

            <div className="text-center space-y-4">
              <div className="bg-white p-6 rounded-lg inline-block">
                <QRCodeSVG 
                  value={generatePaymentQR(selectedMethod)} 
                  size={200}
                  level="M"
                />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Scan this QR code with your {selectedMethod === "aba" ? "ABA" : "Wing"} mobile app
                </p>
                <p className="text-xs text-muted-foreground">
                  Order: #{orderId} • Amount: ${(amount || 0).toLocaleString()}
                </p>
              </div>

              <Button 
                onClick={simulatePayment}
                className="bg-gradient-primary hover:shadow-primary"
              >
                Simulate Payment Complete
              </Button>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="text-center py-8">
            <div className="bg-warning-light p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Clock className="h-8 w-8 text-warning animate-spin" />
            </div>
            <h3 className="text-lg font-medium mb-2">Processing Payment</h3>
            <p className="text-muted-foreground">Please wait while we verify your payment...</p>
          </div>
        )}

        <div className="border-t pt-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Banknote className="h-4 w-4" />
            <span>Alternative: Direct Bank Transfer available</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentQRCode;