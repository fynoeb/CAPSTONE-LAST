import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../config/AuthContext";
import { Home, ClipboardList, Plus, Bell, LogOut, ShieldAlert } from "lucide-react";

export default function KaderLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (unhandled) {
      console.error("Kesalahan saat penanganan keluar:", unhandled);
    }
  };

  const currentPath = location.pathname;

  return (
    <div className="min-h-screen bg-slate-900 md:bg-slate-950 flex items-center justify-center text-slate-800 antialiased font-sans p-0 md:p-6">
      {/* Centered Mobile Layout Container */}
      <div className="w-full max-w-md bg-gradient-to-b from-[#FFD7E1] via-[#E2EDFA] to-[#369AF0] flex flex-col min-h-screen md:min-h-[850px] md:max-h-[900px] md:rounded-[40px] shadow-2xl relative overflow-hidden pb-20">
        
        {/* Scrollable Main Content Area */}
        <main className="flex-1 w-full flex flex-col overflow-y-auto scrollbar-none">
          <Outlet />
        </main>

        {/* Custom Modern Logout Confirmation Modal (Absolute overlay bound to container) */}
        {showLogoutModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xs transition-all animate-fade-in">
            <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl text-center space-y-5 border border-slate-100">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto">
                <ShieldAlert className="h-6 w-6 stroke-[2]" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-black text-slate-800">Konfirmasi Keluar</h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  Apakah Anda yakin ingin keluar dari akun Anda? Anda harus masuk kembali untuk mengelola data.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="py-3 px-4 bg-slate-100 hover:bg-slate-200/80 active:scale-95 text-slate-500 font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleLogout}
                  className="py-3 px-4 bg-red-500 hover:bg-red-600 active:scale-95 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl shadow-md transition-all"
                >
                  Keluar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Fixed Glassmorphism Bottom Navigation Bar */}
        <nav className="absolute bottom-0 left-0 right-0 z-30 bg-white/95 border-t border-slate-100/80 px-4 py-2.5 flex items-center justify-between shadow-lg">
          
          {/* Beranda Button */}
          <button
            onClick={() => navigate("/kader")}
            className={`flex flex-col items-center justify-center w-14 transition-all active:scale-90 ${
              currentPath === "/kader" || currentPath === "/kader/"
                ? "text-[#369AF0]"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Home className="h-5 w-5 mb-1 stroke-[2.2]" />
            <span className="text-[10px] font-bold">Beranda</span>
          </button>

          {/* Riwayat Button */}
          <button
            onClick={() => navigate("/kader/riwayat")}
            className={`flex flex-col items-center justify-center w-14 transition-all active:scale-90 ${
              currentPath === "/kader/riwayat"
                ? "text-[#369AF0]"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <ClipboardList className="h-5 w-5 mb-1 stroke-[2.2]" />
            <span className="text-[10px] font-bold">Riwayat</span>
          </button>

          {/* Elevated Central Actions Plus Button */}
          <div className="relative -top-5 flex flex-col items-center">
            <button
              onClick={() => navigate("/kader/input")}
              className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#369AF0] to-[#FFD7E1] text-white flex items-center justify-center shadow-lg shadow-blue-400/40 border-4 border-white transition-all transform hover:scale-105 active:scale-95"
            >
              <Plus className="h-7 w-7 stroke-[3]" />
            </button>
            <span className="text-[10px] font-bold text-slate-400 mt-1">Input Gizi</span>
          </div>

          {/* Real Notification Page Button */}
          <button
            onClick={() => navigate("/kader/notifikasi")}
            className={`flex flex-col items-center justify-center w-14 transition-all active:scale-90 ${
              currentPath === "/kader/notifikasi"
                ? "text-[#369AF0]"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Bell className="h-5 w-5 mb-1 stroke-[2.2]" />
            <span className="text-[10px] font-bold">Notifikasi</span>
          </button>

          {/* Logout/Profile Button */}
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex flex-col items-center justify-center w-14 transition-all active:scale-90 text-slate-400 hover:text-red-500"
          >
            <LogOut className="h-5 w-5 mb-1 stroke-[2.2]" />
            <span className="text-[10px] font-bold">Keluar</span>
          </button>

        </nav>
      </div>
    </div>
  );
}
