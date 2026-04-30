import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Package, ArrowLeft } from "lucide-react";
import api from "@/lib/api";

const PublicSearch = () => {
  const navigate = useNavigate();
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invoiceNumber.trim()) {
      setError("Please enter an invoice number");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await api.get(`/public/invoice/search/?invoice_number=${encodeURIComponent(invoiceNumber.trim())}`);

      if (response.data.found) {
        // Redirect to the public detail page
        navigate(`/detail/${invoiceNumber.trim()}`);
      } else {
        setError("Order not found. Please check the invoice number and try again.");
      }
    } catch (err: any) {
      console.error("Search error:", err);
      if (err.response?.status === 404) {
        setError("Order not found. Please check the invoice number and try again.");
      } else {
        setError("Failed to search for order. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Track Your Order</CardTitle>
            <CardDescription className="text-gray-600">
              Enter your invoice number to view order details
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSearch} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="invoice_number" className="text-sm font-medium text-gray-700">
                  Invoice Number
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="invoice_number"
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="Enter invoice number (e.g., INV-2025-0001)"
                    className="pl-10 h-12 text-lg"
                    required
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Enter the invoice number from your order confirmation
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
                disabled={isLoading || !invoiceNumber.trim()}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5 mr-2" />
                    Search Order
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Need help? Contact our support team
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicSearch;