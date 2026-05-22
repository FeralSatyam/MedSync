// Production Push
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AddMedicinePage from './pages/AddMedicinePage';
import QRPage from './pages/QRPage';
import PharmacistPage from './pages/PharmacistView';
import ProfilePage from './pages/ProfilePage';
import PharmacyPage from './pages/PharmacyPage';
import OrdersPage from './pages/OrdersPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import AIHealthPage from './pages/AIHealthPage';
import FamilyMembersPage from './pages/FamilyMembersPage';
import AlarmManager from './components/AlarmManager';

function ProtectedRoute({ children }) {
  const token = useAuthStore((s) => s.token);
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AlarmManager />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontWeight: 500,
            fontSize: '13px',
            borderRadius: '12px',
            padding: '12px 16px',
          },
          success: {
            style: { background: '#0f1f3d', color: '#ffffff' },
            iconTheme: { primary: '#00c896', secondary: '#ffffff' },
          },
          error: {
            style: { background: '#c0392b', color: '#ffffff' },
          },
          duration: 3500,
        }}
      />
      <Routes>
        {/* Public Routes - No authentication required */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/pharma/:qrToken" element={<PharmacistPage />} />
        
        {/* Protected Routes - Require authentication */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-medicine"
          element={
            <ProtectedRoute>
              <AddMedicinePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-medicine/:medicineId"
          element={
            <ProtectedRoute>
              <AddMedicinePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/qr"
          element={
            <ProtectedRoute>
              <QRPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pharmacy"
          element={
            <ProtectedRoute>
              <PharmacyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/order-tracking/:orderId"
          element={
            <ProtectedRoute>
              <OrderTrackingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-health"
          element={
            <ProtectedRoute>
              <AIHealthPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/family-members"
          element={
            <ProtectedRoute>
              <FamilyMembersPage />
            </ProtectedRoute>
          }
        />
        
        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}