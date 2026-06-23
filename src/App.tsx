import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./config/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Login from "./pages/Login";
import KaderLayout from "./layouts/KaderLayout";
import KaderDashboard from "./pages/kader/Dashboard";
import InputData from "./pages/kader/InputData";
import Riwayat from "./pages/kader/Riwayat";
import Notifikasi from "./pages/kader/Notifikasi";
import HasilAnalisis from "./pages/kader/HasilAnalisis";
import BidanLayout from "./layouts/BidanLayout";
import DashboardBidan from "./pages/bidan/DashboardBidan";
import DataPemeriksaan from "./pages/bidan/DataPemeriksaan";
import DataKader from "./pages/bidan/DataKader";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/" element={<Login />} />

          {/* Protected Routes - Kader */}
          <Route
            path="/kader"
            element={
              <ProtectedRoute allowedRole="Kader">
                <KaderLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<KaderDashboard />} />
            <Route path="input" element={<InputData />} />
            <Route path="riwayat" element={<Riwayat />} />
            <Route path="notifikasi" element={<Notifikasi />} />
            <Route path="hasil" element={<HasilAnalisis />} />
          </Route>

          {/* Protected Routes - Bidan */}
          <Route
            path="/bidan"
            element={
              <ProtectedRoute allowedRole="Bidan">
                <BidanLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardBidan />} />
            <Route path="data" element={<DataPemeriksaan />} />
            <Route path="kader" element={<DataKader />} />
          </Route>

          {/* Wildcard Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
