import React, { useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../config/AuthContext";
import { LayoutDashboard, ClipboardList, LogOut, Menu, X, Activity, Users } from "lucide-react";

export default function BidanLayout() {
  const { logout, fullName } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const navItems = [
    {
      name: "Dashboard",
      path: "/bidan",
      icon: LayoutDashboard,
      end: true
    },
    {
      name: "Data Pemeriksaan",
      path: "/bidan/data",
      icon: ClipboardList,
      end: false
    },
    {
      name: "Data Kader",
      path: "/bidan/kader",
      icon: Users,
      end: false
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-800">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex md:w-64 flex-col fixed inset-y-0 left-0 glass-morphism z-20 border-r border-[#FFD7E1]/50">
        <div className="h-16 flex items-center px-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="bg-[#FFD7E1] p-2 rounded-xl text-[#369AF0]">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-slate-900 block leading-tight">SIGIZI</span>
              <span className="text-[10px] text-slate-500 font-extrabold tracking-wider uppercase block">Portal Bidan</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.end 
              ? location.pathname === item.path 
              : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-[#369AF0] text-white shadow-xs"
                    : "text-slate-600 hover:bg-[#FFD7E1]/30 hover:text-[#369AF0]"
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? "text-white" : "text-slate-400 group-hover:text-[#369AF0]"}`} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-205">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            <span>Keluar Sesi</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-[#FFD7E1]/70 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="bg-[#FFD7E1] p-1.5 rounded-lg text-[#369AF0]">
            <Activity className="h-4 w-4" />
          </div>
          <span className="font-bold text-base text-slate-900">SIGIZI</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        >
          {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Mobile Drawer */}
      {isSidebarOpen && (
        <>
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-64 bg-white z-50 flex flex-col md:hidden border-r border-[#FFD7E1] animate-slide-in">
            <div className="h-16 flex items-center px-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="bg-[#FFD7E1] p-2 rounded-lg text-[#369AF0]">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-bold text-lg tracking-tight text-slate-900 block leading-tight">SIGIZI</span>
                  <span className="text-xs text-slate-500 font-medium tracking-wider uppercase block">Portal Bidan</span>
                </div>
              </div>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1.5">
              {navItems.map((item) => {
                const isActive = item.end 
                  ? location.pathname === item.path 
                  : location.pathname.startsWith(item.path);

                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-[#369AF0] text-white"
                        : "text-slate-600 hover:bg-[#FFD7E1]/40 hover:text-[#369AF0]"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-200">
              <button
                onClick={() => {
                  setIsSidebarOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all duration-200"
              >
                <LogOut className="h-5 w-5" />
                <span>Keluar Sesi</span>
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Main Content Pane */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        {/* Top Navbar for Desktop */}
        <header className="hidden md:flex items-center justify-between h-16 px-8 bg-white/70 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">
              Halo, {fullName || "Bidan Puskesmas"}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-sm font-medium text-slate-500">Administrator Puskesmas</span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-slate-600 hover:text-rose-600 font-semibold text-sm px-3.5 py-1.5 rounded-lg hover:bg-rose-50/50 transition-all duration-200"
            title="Keluar Sesi"
          >
            <LogOut className="h-4 w-4" />
            <span>Keluar Sesi</span>
          </button>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
