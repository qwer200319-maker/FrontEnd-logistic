 // src/components/invoice/InvoiceView.tsx
import React, { useEffect, useState } from "react";
import api from "../../lib/api";

interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface User {
  id: number;
  full_name: string;
  email: string;
}

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  weight_kg: number | null;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  invoice_number: string;
}

interface ShippingOrder {
  id: number;
  shipping_code: string;
  shipping_date: string;
  sender_phone: string;
  receiver_phone: string;
  shipping_cost: number;
  shipping_fee: number | null;
  delivery_address: string;
  ordered_by: User;
  ordered_to: User;
  shipping_location: {
    id: number;
    name: string;
  };
  calculation_type: string;
  total_value: number | null;
  total_weight_kg: number | null;
  total_weight_ton: number | null;
  total_cbm: number | null;
  items: OrderItem[];
}

interface Invoice {
  id: number;
  invoice_number: string;
  shipping_order: ShippingOrder;
  billed_to: User;
  billed_from: User;
  issue_date: string;
  due_date: string;
  payment_date?: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  payment_method?: string;
  notes?: string;
  terms_and_conditions?: string;
  items: InvoiceItem[];
}

import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, QrCode, Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const InvoiceView: React.FC = () => {
  const { orderId } = useParams<{ orderId?: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const fetchInvoice = async () => {
    if (!orderId) {
      setError("No order ID provided.");
      setLoading(false);
      return;
    }

    try {
      // First, try to get the invoice by shipping_order ID
      const response = await api.get<Invoice[]>(`/invoices/?shipping_order=${orderId}`);
      if (response.data && response.data.length > 0) {
        // Find the invoice that matches the specific shipping order ID
        const matchingInvoice = response.data.find(invoice =>
          invoice.shipping_order && invoice.shipping_order.id.toString() === orderId
        );
        
        if (matchingInvoice) {
          console.log('Invoice data fetched by shipping order:', matchingInvoice);
          setInvoice(matchingInvoice);
        } else {
          // If no matching invoice found, use the first one (fallback)
          console.log('Using first invoice as fallback:', response.data[0]);
          setInvoice(response.data[0]);
        }
      } else {
        // If not found by shipping order, try fetching the invoice by its own ID
        try {
          const invoiceResponse = await api.get<Invoice>(`/invoices/${orderId}/`);
          console.log('Invoice data fetched by invoice ID:', invoiceResponse.data);
          setInvoice(invoiceResponse.data);
        } catch (invoiceErr) {
          setError("No invoice found for this order.");
        }
      }
    } catch (err: any) {
      console.error('Error fetching invoice:', err);
      setError(err.message || "Failed to fetch invoice");
    } finally {
      setLoading(false);
    }
  };
  const markAsPaid = async () => {
    if (!invoice) return;
    try {
      await api.post(`/invoices/${invoice.id}/mark_as_paid/`);
      fetchInvoice(); // Refresh invoice data
    } catch (err: any) {
      setError(err.message || "Failed to mark as paid");
    }
  };

  const sendInvoice = async () => {
    if (!invoice) return;
    try {
      await api.post(`/invoices/${invoice.id}/send_invoice/`);
      fetchInvoice(); // Refresh invoice data
    } catch (err: any) {
      setError(err.message || "Failed to send invoice");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    fetchInvoice();
  }, [orderId]);

  if (loading) return <div className="p-8 text-center">Loading invoice...</div>;
  if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;
  if (!invoice) return <div className="p-8 text-center text-gray-500">No invoice found.</div>;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'text-green-600 bg-green-100';
      case 'sent': return 'text-blue-600 bg-blue-100';
      case 'draft': return 'text-gray-600 bg-gray-100';
      case 'overdue': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const generateInvoiceQR = () => {
    if (!invoice) return "";
    
    const invoiceData = {
      invoiceNumber: invoice.invoice_number,
      orderId: invoice.shipping_order.id,
      totalAmount: invoice.total_amount,
      status: invoice.status,
      dueDate: invoice.due_date,
      billedTo: invoice.billed_to.full_name,
      url: `${window.location.origin}/order-detail-new/${invoice.shipping_order.id}`
    };
    
    return JSON.stringify(invoiceData);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              size: A5;
              margin: 10mm;
            }
            .no-print {
              display: none !important;
            }
            .print-container {
              width: 148mm;
              margin: 0 auto;
              font-size: 10px;
              line-height: 1.3;
            }
            .print-container .text-2xl {
              font-size: 1.1rem;
            }
            .print-container .text-lg {
              font-size: 0.85rem;
            }
            .print-container .text-base {
              font-size: 0.75rem;
            }
            .print-container .text-sm {
              font-size: 0.65rem;
            }
            .print-container .text-xs {
              font-size: 0.55rem;
            }
            .print-container .px-6 {
              padding-left: 0.5rem;
              padding-right: 0.5rem;
            }
            .print-container .py-3 {
              padding-top: 0.25rem;
              padding-bottom: 0.25rem;
            }
            .print-container .mb-6 {
              margin-bottom: 0.5rem;
            }
            .print-container .mb-3 {
              margin-bottom: 0.25rem;
            }
            .print-container .mb-2 {
              margin-bottom: 0.2rem;
            }
            .print-container .mb-1 {
              margin-bottom: 0.1rem;
            }
            .print-container .mt-4 {
              margin-top: 0.25rem;
            }
            .print-container .mt-3 {
              margin-top: 0.2rem;
            }
            .print-container .mt-1 {
              margin-top: 0.1rem;
            }
            .print-container .mt-2 {
              margin-top: 0.15rem;
            }
            .print-container .space-y-2 > * + * {
              margin-top: 0.15rem;
            }
            .print-container .space-y-1 > * + * {
              margin-top: 0.1rem;
            }
            .print-container .gap-6 {
              gap: 0.5rem;
            }
            .print-container .gap-4 {
              gap: 0.25rem;
            }
            .print-container .gap-3 {
              gap: 0.2rem;
            }
            .print-container .p-2 {
              padding: 0.15rem;
            }
            .print-container .p-4 {
              padding: 0.25rem;
            }
            .print-container .px-2 {
              padding-left: 0.15rem;
              padding-right: 0.15rem;
            }
            .print-container .py-1 {
              padding-top: 0.1rem;
              padding-bottom: 0.1rem;
            }
            .print-container .py-2 {
              padding-top: 0.15rem;
              padding-bottom: 0.15rem;
            }
            .print-container .py-3 {
              padding-top: 0.2rem;
              padding-bottom: 0.2rem;
            }
            .print-container table th,
            .print-container table td {
              padding: 0.15rem 0.25rem;
            }
            .print-container .max-w-sm {
              max-width: 8rem;
            }
            .print-container .w-full {
              width: 100%;
            }
            .print-container .bg-gray-50 {
              background-color: white !important;
            }
            .print-container .bg-white {
              background-color: white !important;
            }
            .print-container .shadow-lg,
            .print-container .shadow-sm,
            .print-container .border {
              box-shadow: none !important;
              border: none !important;
            }
            .print-container .rounded-lg,
            .print-container .rounded-md,
            .print-container .rounded {
              border-radius: 0 !important;
            }
            .print-container .grid-cols-1 {
              grid-template-columns: repeat(1, minmax(0, 1fr));
            }
            .print-container .md\:grid-cols-2 {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
            .print-container .lg\:grid-cols-3 {
              grid-template-columns: repeat(3, minmax(0, 1fr));
            }
            .print-container .flex {
              display: flex;
            }
            .print-container .flex-col {
              flex-direction: column;
            }
            .print-container .items-center {
              align-items: center;
            }
            .print-container .justify-between {
              justify-content: space-between;
            }
            .print-container .justify-end {
              justify-content: flex-end;
            }
            .print-container .flex-1 {
              flex: 1 1 0%;
            }
            .print-container .flex-shrink-0 {
              flex-shrink: 0;
            }
            .print-container .space-x-2 > * + * {
              margin-left: 0.2rem;
            }
            .print-container .divide-y > * + * {
              border-top-width: 1px;
            }
            .print-container .divide-gray-200 > * + * {
              border-color: #e5e7eb;
            }
            .print-container .min-w-full {
              min-width: 100%;
            }
            .print-container .whitespace-nowrap {
              white-space: nowrap;
            }
            .print-container .uppercase {
              text-transform: uppercase;
            }
            .print-container .tracking-wider {
              letter-spacing: 0.05em;
            }
            .print-container .font-medium {
              font-weight: 500;
            }
            .print-container .font-semibold {
              font-weight: 600;
            }
            .print-container .font-bold {
              font-weight: 700;
            }
            .print-container .text-gray-500 {
              color: #6b7280;
            }
            .print-container .text-gray-600 {
              color: #4b5563;
            }
            .print-container .text-gray-800 {
              color: #1f2937;
            }
            .print-container .text-gray-900 {
              color: #111827;
            }
            .print-container .text-blue-600 {
              color: #2563eb;
            }
            .print-container .text-blue-800 {
              color: #1e40af;
            }
            .print-container .text-green-800 {
              color: #166534;
            }
            .print-container .bg-blue-100 {
              background-color: #dbeafe;
            }
            .print-container .bg-green-100 {
              background-color: #dcfce7;
            }
            .print-container .leading-5 {
              line-height: 1.25rem;
            }
            .print-container .inline-flex {
              display: inline-flex;
            }
            .print-container .flex-wrap {
              flex-wrap: wrap;
            }
            .print-container .gap-1 {
              gap: 0.1rem;
            }
          }
        `
      }} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 print-container">
        {/* Back to Orders Button */}
        <div className="mb-6 no-print">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </button>
        </div>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <div className="px-4 sm:px-6 py-3 bg-blue-600 text-white">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold mb-1 break-words">Invoice #{invoice.invoice_number}</h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
                  <span className="flex items-center">
                    Status:
                    <span className={`ml-2 px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </span>
                  <span>Issue: {new Date(invoice.issue_date).toLocaleDateString()}</span>
                  <span>Due: {new Date(invoice.due_date).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 no-print sm:flex-nowrap">
                <button
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-2 sm:px-3 rounded text-xs sm:text-sm flex items-center"
                  onClick={handlePrint}
                >
                  <Printer className="inline mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                  Print
                </button>
                <button
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-2 sm:px-3 rounded text-xs sm:text-sm"
                  onClick={markAsPaid}
                  disabled={invoice.status.toLowerCase() === 'paid'}
                >
                  Mark as Paid
                </button>
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-2 sm:px-3 rounded text-xs sm:text-sm"
                  onClick={sendInvoice}
                >
                  Send Invoice
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200">
              {/* Billing Information Section */}
              <div className="px-6 py-3">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-gray-800 mb-2">Billed To:</h3>
                    <div className="text-sm text-gray-900 space-y-1">
                      <p className="font-medium">{invoice.billed_to?.full_name || 'N/A'}</p>
                      <p>{invoice.billed_to?.email || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-800 mb-2">Billed From:</h3>
                    <div className="text-sm text-gray-900 space-y-1">
                      <p className="font-medium">{invoice.billed_from?.full_name || 'N/A'}</p>
                      <p>{invoice.billed_from?.email || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Order Details */}
              {invoice.shipping_order && (
                <div className="px-6 py-3 border-t border-gray-200">
                  <h3 className="text-base font-semibold text-gray-800 mb-2">Shipping Order Details</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                    <div className="space-y-1">
                      <p className="font-medium text-gray-500">Shipping Code</p>
                      <p className="text-gray-900">{invoice.shipping_order.shipping_code || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-gray-500">Shipping Cost</p>
                      <p className="text-gray-900">${Number(invoice.shipping_order.shipping_cost || 0).toFixed(2)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-gray-500">Shipping Fee</p>
                      <p className="text-gray-900">${Number(invoice.shipping_order.shipping_fee || 0).toFixed(2)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-gray-500">Shipping Date</p>
                      <p className="text-gray-900">{invoice.shipping_order.shipping_date ? new Date(invoice.shipping_order.shipping_date).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-gray-500">Delivery Address</p>
                      <p className="text-gray-900">{invoice.shipping_order.delivery_address || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-gray-500">Total Value</p>
                      <p className="text-gray-900">
                        {invoice.shipping_order.total_value !== null ? `${invoice.shipping_order.total_value.toFixed(3)} ${invoice.shipping_order.calculation_type === "kg" ? "Kg" : invoice.shipping_order.calculation_type === "ton" ? "Ton" : "CBM"}` : 'N/A'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-gray-500">Calculation Type</p>
                      <p className="text-gray-900">
                        {invoice.shipping_order.calculation_type === "kg" && "Kg"}
                        {invoice.shipping_order.calculation_type === "ton" && "Ton"}
                        {invoice.shipping_order.calculation_type === "cbm" && "CBM"}
                      </p>
                    </div>
                    {/* <div className="space-y-1">
                      <p className="font-medium text-gray-500">Total Weight</p>
                      <p className="text-gray-900">
                        {invoice.shipping_order.calculation_type === "kg" && invoice.shipping_order.total_weight_kg !== null ? `${invoice.shipping_order.total_weight_kg.toFixed(3)} Kg` : null}
                        {invoice.shipping_order.calculation_type === "ton" && invoice.shipping_order.total_weight_ton !== null ? `${invoice.shipping_order.total_weight_ton.toFixed(6)} Ton` : null}
                        {invoice.shipping_order.calculation_type === "cbm" && invoice.shipping_order.total_cbm !== null ? `${invoice.shipping_order.total_cbm.toFixed(6)} CBM` : null}
                      </p>
                    </div> */}
                  </div>
                  
                  {/* Order Items */}
                  {invoice.shipping_order.items && invoice.shipping_order.items.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-sm font-semibold text-gray-800 mb-2">Order Items</h4>
                      <div className="space-y-1">
                        {invoice.shipping_order.items.map((item) => (
                          <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                            <div className="flex-1">
                              <p className="font-medium text-xs">{item.product_name}</p>
                              <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                              {item.invoice_number && (
                                <p className="text-xs text-blue-600 font-medium">Inv: {item.invoice_number}</p>
                              )}
                            </div>
                            {/* <div className="flex flex-wrap gap-1 ml-2">
                              {item.weight_kg !== null && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
                                  {item.weight_kg}kg
                                </span>
                              )}
                              {item.length_cm !== null && item.width_cm !== null && item.height_cm !== null && (
                                <span className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded">
                                  {item.length_cm}×{item.width_cm}×{item.height_cm}cm
                                </span>
                              )}
                            </div> */}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Invoice Items */}
              <div className="px-6 py-3 border-t border-gray-200">
                <h3 className="text-base font-semibold text-gray-800 mb-2">Invoice Items</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-900">Shipping Services</span>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Cost: ${Number(invoice.shipping_order.shipping_cost || 0).toFixed(2)}</div>
                      <div className="text-sm text-gray-600">Fee: ${Number(invoice.shipping_order.shipping_fee || 0).toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoice Summary */}
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                <div className="flex justify-end">
                  <div className="text-right">
                    <div className="text-sm text-gray-600 mb-1">Total Amount:</div>
                    <div className="text-lg font-bold text-gray-900">
                      ${Number(invoice.shipping_order.shipping_cost + invoice.shipping_order.shipping_fee).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              {(invoice.notes || invoice.terms_and_conditions) && (
                <div className="px-6 py-3 border-t border-gray-200 text-sm text-gray-600">
                  {invoice.notes && (
                    <div className="mb-3">
                      <h4 className="font-semibold text-gray-800 mb-1 text-sm">Notes</h4>
                      <p className="text-xs leading-relaxed">{invoice.notes}</p>
                    </div>
                  )}
                  {invoice.terms_and_conditions && (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1 text-sm">Terms and Conditions</h4>
                      <p className="text-xs leading-relaxed">{invoice.terms_and_conditions}</p>
                    </div>
                  )}
                </div>
              )}

              {/* QR Code Section */}
              {/* <div
                className="px-6 py-4 border-t border-gray-200 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors no-print"
                onClick={() => navigate(`/order-detail-new/${invoice.shipping_order.id}`)}
              >
                <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                      <QrCode className="mr-2 h-5 w-5" />
                      Invoice QR Code
                    </h3>
                    <p className="text-sm text-gray-600">
                      Scan this QR code to view order details or click to view order details directly
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                      <QRCodeSVG
                        value={generateInvoiceQR()}
                        size={120}
                        level="M"
                        includeMargin={true}
                      />
                    </div>
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Invoice #{invoice.invoice_number}
                    </p>
                  </div>
                </div>
              </div> */}
            </div>
          </div>
      </div>
    </div>
  );
};

export default InvoiceView;
