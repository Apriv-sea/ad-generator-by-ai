
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { GoogleSheetsProvider } from "@/contexts/GoogleSheetsContext";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";

// Pages
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import AuthCallback from "@/pages/AuthCallback";
import GoogleAuthCallback from "@/pages/GoogleAuthCallback";
import Dashboard from "@/pages/Dashboard";
import Projects from "@/pages/Projects";
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
    path: "/auth/google",
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
        <AppLayout>
          <Dashboard />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/projects", 
    element: (
      <ProtectedRoute>
        <AppLayout>
          <Projects />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/campaigns",
    element: (
      <ProtectedRoute>
        <AppLayout>
          <Campaigns />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/clients",
    element: (
      <ProtectedRoute>
        <AppLayout>
          <Clients />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/settings",
    element: (
      <ProtectedRoute>
        <AppLayout>
          <Settings />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <AppLayout>
          <Profile />
        </AppLayout>
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
