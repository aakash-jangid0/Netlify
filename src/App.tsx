import { BrowserRouter as Router, Routes, Route, useSearchParams, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WebsiteSettingsProvider } from './contexts/WebsiteSettingsContext';
import { SocketProvider } from './context/socket/SocketProvider';
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/common/ErrorBoundary';
import NetworkStatus from './components/common/NetworkStatus.jsx';
import ErrorsPage from './pages/ErrorsPage';
import { setupGlobalToastDismiss } from './utils/toastUtils';
import { useEffect } from 'react';
import EmergencyToastDismiss from './components/ui/EmergencyToastDismiss';

// Create a separate component for diagnostic redirection
const DiagnosticRedirect = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  
  if (searchParams.get('diagnostics') === 'true' && location.pathname === '/') {
    return <Navigate to="/diagnostics" replace />;
  }
  
  return null;
};

// Pages
import Home from './pages/Home';
import Menu from './pages/Menu';
import Cart from './pages/Cart';
import Auth from './pages/Auth';
import OrderHistory from './pages/OrderHistory';
import OrderTracking from './pages/OrderTracking';
import KitchenDashboard from './pages/kitchen/KitchenDashboard';
import CounterDashboard from './pages/counter/CounterDashboard';
import AdminDashboard from './pages/admin/Dashboard';
import MenuManagement from './pages/admin/MenuManagement';
import OrderManagement from './pages/admin/OrderManagement';
import QRCodeManagement from './pages/admin/QRCodeManagement';
import InvoiceManagement from './pages/admin/InvoiceManagement';
import InvoiceTemplateSettings from './pages/admin/InvoiceTemplateSettings';
import InventoryManagement from './pages/admin/InventoryManagement';
import StaffManagement from './pages/admin/StaffManagement';
import StaffProfile from './pages/admin/StaffProfile';
import CustomerManagement from './pages/admin/CustomerManagement';
import FeedbackManagement from './pages/admin/FeedbackManagement';
import CouponManagement from './pages/admin/CouponManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import CustomerSupport from './pages/admin/CustomerSupport';
import WebsiteSettingsComprehensive from './pages/admin/WebsiteSettingsComprehensive';


export default function App() {
  // Initialize global toast dismiss functionality
  useEffect(() => {
    setupGlobalToastDismiss();
  }, []);

  return (
    <ErrorBoundary>
      <NetworkStatus />
      <AuthProvider>
        <CartProvider>
          <WebsiteSettingsProvider>
            <SocketProvider>
              <Router>
                <Toaster 
                  position="top-right"
                  toastOptions={{
                    duration: 3000,
                    style: {
                      background: '#fff',
                      color: '#333',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      cursor: 'pointer',
                      userSelect: 'none',
                      transition: 'all 0.2s ease',
                      maxWidth: '400px',
                      padding: '12px 16px',
                    },
                    success: {
                      duration: 3000,
                      iconTheme: {
                        primary: '#10b981',
                        secondary: '#fff',
                      },
                      style: {
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        color: '#166534',
                        cursor: 'pointer',
                      },
                    },
                    error: {
                      duration: 3000,
                      iconTheme: {
                        primary: '#ef4444',
                        secondary: '#fff',
                      },
                      style: {
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        color: '#dc2626',
                        cursor: 'pointer',
                      },
                    },
                    loading: {
                      duration: 10000, // Changed from Infinity to 10 seconds
                      style: {
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        color: '#475569',
                        cursor: 'pointer',
                      },
                    },
                  }}
                  containerStyle={{
                    top: 20,
                    right: 20,
                    zIndex: 9999,
                  }}
                  reverseOrder={false}
                  gutter={8}
                />
                <DiagnosticRedirect />
                <Routes>
                  {/* Diagnostics Page - No Layout */}
                  <Route path="/diagnostics" element={<ErrorsPage />} />
                
                {/* Public Routes */}
                <Route element={<Layout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/menu" element={<Menu />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/orders" element={<OrderHistory />} />
                  <Route path="/track/:orderId" element={<OrderTracking />} />
                </Route>

                {/* Kitchen Dashboard */}
                <Route path="/kitchen" element={<KitchenDashboard />} />

                {/* Counter Dashboard */}
                <Route path="/counter" element={<CounterDashboard />} />

                {/* Admin Dashboard */}
                <Route path="/admin" element={<AdminDashboard />}>
                  <Route path="menu" element={<MenuManagement />} />
                  <Route path="orders" element={<OrderManagement />} />
                  <Route path="/admin/customers" element={<CustomerManagement />} />
                  <Route path="invoices" element={<InvoiceManagement />} />
                  <Route path="invoice-settings" element={<InvoiceTemplateSettings />} />
                  <Route path="qr-codes" element={<QRCodeManagement />} />
                  <Route path="inventory" element={<InventoryManagement />} />
                  <Route path="staff" element={<StaffManagement />} />
                  <Route path="staff/:id" element={<StaffProfile />} />
                  <Route path="feedback" element={<FeedbackManagement />} />
                  <Route path="coupons" element={<CouponManagement />} />
                  <Route path="categories" element={<CategoryManagement />} />
                  <Route path="support" element={<CustomerSupport />} />
                  <Route path="website" element={<WebsiteSettingsComprehensive />} />
                </Route>
              </Routes>
            </Router>
          </SocketProvider>
          </WebsiteSettingsProvider>
        </CartProvider>
      </AuthProvider>
      <EmergencyToastDismiss />
    </ErrorBoundary>
  );
}