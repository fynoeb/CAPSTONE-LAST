import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../config/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRole?: "Kader" | "Bidan";
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRole,
}) => {
  const { user, loading, role, isDemo, mockUser } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1e293b] border-t-transparent"></div>
          <p className="text-sm font-normal text-slate-500">Memuat sesi data...</p>
        </div>
      </div>
    );
  }

  const isAuthenticated = (!!user || (isDemo && !!mockUser)) && !!role;

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // If a specific role is required, verify access match
  if (allowedRole && role !== allowedRole) {
    // Redirect to correct dashboard based on actual role
    if (role === "Kader") {
      return <Navigate to="/kader" replace />;
    }
    if (role === "Bidan") {
      return <Navigate to="/bidan" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};
