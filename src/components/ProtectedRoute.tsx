
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true 
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  console.log("🛡️ ProtectedRoute - isLoading:", isLoading, "isAuthenticated:", isAuthenticated, "requireAuth:", requireAuth);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Vérification de l'authentification...</span>
        </div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    console.log("🛡️ Redirecting to auth - auth required but user not authenticated");
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If user is authenticated but trying to access auth page, redirect to dashboard
  if (!requireAuth && isAuthenticated && location.pathname === '/auth') {
    console.log("🛡️ Redirecting to dashboard - user authenticated trying to access auth");
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
