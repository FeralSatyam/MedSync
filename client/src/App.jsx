import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PatientProfiles from './pages/PatientProfiles';
import AddMedicine from './pages/AddMedicine';
import QRPage from './pages/QRPage';
import PharmacistView from './pages/PharmacistView';

function HomeRedirect() {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-600">Loading…</p>
      </div>
    );
  }
  return <Navigate to={user ? '/dashboard' : '/login'} replace />;
}

function AppShell() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients"
          element={
            <ProtectedRoute>
              <PatientProfiles />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/add/:patientId"
          element={
            <ProtectedRoute>
              <AddMedicine />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/medicine/:medicineId/edit"
          element={
            <ProtectedRoute>
              <AddMedicine />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/qr/:patientId"
          element={
            <ProtectedRoute>
              <QRPage />
            </ProtectedRoute>
          }
        />
        <Route path="/pharmacist/:qrToken" element={<PharmacistView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
