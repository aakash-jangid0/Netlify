import { BrowserRouter as Router, Routes, Route, useSearchParams, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/common/ErrorBoundary';
import NetworkStatus from './components/common/NetworkStatus.jsx';
import ErrorsPage from './pages/ErrorsPage';

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
import InventoryManagement from './pages/admin/InventoryManagement';
import StaffManagement from './pages/admin/StaffManagement';
import StaffProfile from './pages/admin/StaffProfile';
import CustomerManagement from './pages/admin/CustomerManagement';
import FeedbackManagement from './pages/admin/FeedbackManagement';


export default function App() {
  return (
    <ErrorBoundary>
      <NetworkStatus />
      <AuthProvider>
        <CartProvider>
          <Router>
            <Toaster position="top-right" />
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
                <Route path="qr-codes" element={<QRCodeManagement />} />
                <Route path="inventory" element={<InventoryManagement />} />
                <Route path="staff" element={<StaffManagement />} />
                <Route path="staff/:id" element={<StaffProfile />} />
                <Route path="feedback" element={<FeedbackManagement />} />
              </Route>
            </Routes>
          </Router>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}