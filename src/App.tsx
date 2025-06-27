
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { GoogleSheetsProvider } from "@/contexts/GoogleSheetsContext";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";

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
    element: <Index />,
  },
  {
    path: "/auth",
    element: <Auth />,
  },
  {
    path: "/auth/callback",
    element: <AuthCallback />,
  },
  {
    path: "/auth/callback/google",
    element: <GoogleAuthCallback />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/campaigns",
    element: <Campaigns />,
  },
  {
    path: "/clients",
    element: <Clients />,
  },
  {
    path: "/settings",
    element: <Settings />,
  },
  {
    path: "/profile",
    element: <Profile />,
  },
  {
    path: "/how-it-works",
    element: <HowItWorks />,
  },
  {
    path: "/privacy-policy",
    element: <PrivacyPolicy />,
  },
  {
    path: "/localhost-redirect",
    element: <LocalhostRedirect />,
  },
  {
    path: "*",
    element: <NotFound />,
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
