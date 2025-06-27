
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { GoogleSheetsProvider } from "@/contexts/GoogleSheetsContext";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";

// Pages
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import AuthCallback from "@/pages/AuthCallback";
import GoogleAuthCallback from "@/pages/GoogleAuthCallback";
import Dashboard from "@/pages/Dashboard";
import Campaigns from "@/pages/Campaigns";
import Clients from "@/pages/Clients";
import Settings from "@/pages/Settings";
import Profile from "@/pages/Profile";
import HowItWorks from "@/pages/HowItWorks";
import NotFound from "@/pages/NotFound";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import LocalhostRedirect from "@/pages/LocalhostRedirect";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoute requireAuth={false}>
        <Index />
      </ProtectedRoute>
    ),
  },
  {
    path: "/auth",
    element: (
      <ProtectedRoute requireAuth={false}>
        <Auth />
      </ProtectedRoute>
    ),
  },
  {
    path: "/auth/callback",
    element: (
      <ProtectedRoute requireAuth={false}>
        <AuthCallback />
      </ProtectedRoute>
    ),
  },
  {
    path: "/auth/callback/google",
    element: (
      <ProtectedRoute requireAuth={false}>
        <GoogleAuthCallback />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/campaigns",
    element: (
      <ProtectedRoute>
        <Campaigns />
      </ProtectedRoute>
    ),
  },
  {
    path: "/clients",
    element: (
      <ProtectedRoute>
        <Clients />
      </ProtectedRoute>
    ),
  },
  {
    path: "/settings",
    element: (
      <ProtectedRoute>
        <Settings />
      </ProtectedRoute>
    ),
  },
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <Profile />
      </ProtectedRoute>
    ),
  },
  {
    path: "/how-it-works",
    element: (
      <ProtectedRoute requireAuth={false}>
        <HowItWorks />
      </ProtectedRoute>
    ),
  },
  {
    path: "/privacy-policy",
    element: (
      <ProtectedRoute requireAuth={false}>
        <PrivacyPolicy />
      </ProtectedRoute>
    ),
  },
  {
    path: "/localhost-redirect",
    element: (
      <ProtectedRoute requireAuth={false}>
        <LocalhostRedirect />
      </ProtectedRoute>
    ),
  },
  {
    path: "*",
    element: (
      <ProtectedRoute requireAuth={false}>
        <NotFound />
      </ProtectedRoute>
    ),
  },
]);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <GoogleSheetsProvider>
          <GlobalErrorBoundary>
            <RouterProvider router={router} />
            <Toaster />
          </GlobalErrorBoundary>
        </GoogleSheetsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
