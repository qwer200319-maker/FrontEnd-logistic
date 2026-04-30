import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import LoginForm from "./components/auth/LoginForm";
import RegisterForm from "./components/auth/RegisterForm";
import Dashboard from "./components/dashboard/Dashboard";
import CreateOrderForm from "./components/orders/CreateOrderForm";
import OrdersList from "./components/orders/OrdersList";
import InvoiceView from "./components/invoice/InvoiceView";
import ReportsPage from "./components/reports/ReportsPage";
import PaymentsPage from "./components/payments/PaymentsPage";
import NotFound from "./pages/NotFound";
import OrderDetail from "./components/orders/OrderDetail";
import ManageUsersPage from "./components/manage-users/ManageUsersPage";
import SystemSettingsPage from "./components/system-settings/SystemSettingsPage";
import AuditLogsPage from "./components/audit-logs/AuditLogsPage";
import OrderDetailNew from "./components/orders/OrderDetailNew";
import CreateOrderQRCode from "./components/orders/CreateOrderQRCode";
import CreateOrderQRCodeList from "./components/orders/CreateOrderQRCodeList";
import CreateOrderQRCodeDetail from "./components/orders/CreateOrderQRCodeDetail";
import CreateOrderQRCodeSearch from "./components/orders/CreateOrderQRCodeSearch";
import CreateOrderQRCodeSubmit from "./components/orders/CreateOrderQRCodeSubmit";
import ReportCreateOrderQRCode from "./components/reports/ReportCreateOrderQRCode";
import PublicSearch from "./components/orders/PublicSearch";
import PublicDetail from "./components/orders/PublicDetail";
import { hasValidSession, getCurrentUser } from "./lib/auth";

// Component to handle session-based routing
const AppRouter = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = () => {
      if (hasValidSession()) {
        setIsAuthenticated(true);
        const user = getCurrentUser();
        setUserRole(user?.role || null);
      } else {
        setIsAuthenticated(false);
        setUserRole(null);
      }
      setIsLoading(false);
    };

    checkSession();

    // Listen for session updates (e.g., after login)
    const handleSessionUpdate = () => {
      checkSession();
    };

    window.addEventListener('sessionUpdate', handleSessionUpdate);

    return () => {
      window.removeEventListener('sessionUpdate', handleSessionUpdate);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Auth Routes - only accessible when not authenticated */}
      <Route
        path="/"
        element={isAuthenticated ? <Navigate to={userRole === "admin" ? "/dashboard" : "/qr-orders/create"} replace /> : <LoginForm />}
      />
      <Route
        path="/login"
        element={<LoginForm />}
      />
      <Route path="/register" element={<RegisterForm />} />

      {/* Main App Routes - require authentication */}
      <Route
        path="/dashboard"
        element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/orders"
        element={isAuthenticated ? <OrdersList /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/orders/create"
        element={isAuthenticated ? <CreateOrderForm /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/orders/:orderId"
        element={isAuthenticated ? <OrderDetail /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/payments"
        element={isAuthenticated ? <PaymentsPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/invoice/:orderId"
        element={isAuthenticated ? <InvoiceView /> : <Navigate to="/login" replace />}
      />

      {/* QR Order Routes */}
      <Route
        path="/qr-orders/create"
        element={isAuthenticated ? <CreateOrderQRCode /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/qr-orders/list"
        element={isAuthenticated ? <CreateOrderQRCodeList /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/qr-orders/detail/:id"
        element={isAuthenticated ? <CreateOrderQRCodeDetail /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/qr-orders/search"
        element={isAuthenticated ? <CreateOrderQRCodeSearch /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/qr-orders/submit"
        element={isAuthenticated ? <CreateOrderQRCodeSubmit /> : <Navigate to="/login" replace />}
      />

      {/* Reports Route */}
      <Route
        path="/reports"
        element={isAuthenticated ? <ReportsPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/report/qr-orders"
        element={isAuthenticated ? <ReportCreateOrderQRCode /> : <Navigate to="/login" replace />}
      />

      {/* Public Order Detail Route */}
      <Route path="/order-detail-new/:orderId" element={<OrderDetailNew />} />

      {/* Public Invoice Search Routes */}
      <Route path="/search" element={<PublicSearch />} />
      <Route path="/detail/:invoice_number" element={<PublicDetail />} />


      {/* Admin-only Routes */}
      <Route
        path="/users"
        element={isAuthenticated && userRole === "admin" ? <ManageUsersPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/settings"
        element={isAuthenticated && userRole === "admin" ? <SystemSettingsPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/audit"
        element={isAuthenticated && userRole === "admin" ? <AuditLogsPage /> : <Navigate to="/login" replace />}
      />

      {/* Catch-all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRouter />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
