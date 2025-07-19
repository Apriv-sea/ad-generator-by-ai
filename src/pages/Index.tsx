
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthTokenHandler } from "@/hooks/useAuthTokenHandler";
import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { authError } = useAuthTokenHandler();

  // Afficher un loader pendant le chargement de l'auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-xl font-bold text-slate-900">
              Ad Content Generator
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/how-it-works" className="text-slate-600 hover:text-blue-600 transition-colors">
                Comment ça marche
              </Link>
              <Link to="/privacy-policy" className="text-slate-600 hover:text-blue-600 transition-colors">
                Confidentialité
              </Link>
            </nav>
            <div className="flex items-center gap-3">
              {!isAuthenticated ? (
                <>
                  <Button asChild variant="ghost">
                    <Link to="/auth">
                      Connexion
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link to="/auth">
                      Créer un compte
                    </Link>
                  </Button>
                </>
              ) : (
                <Button asChild>
                  <Link to="/dashboard">
                    Accéder au tableau de bord
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <HeroSection authError={authError} />
          <FeaturesSection />
          {!isAuthenticated && <HowItWorksSection />}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8 text-center">
        <Link to="/privacy-policy" className="text-slate-500 hover:text-blue-600 transition-colors text-sm">
          Politique de confidentialité
        </Link>
      </footer>
    </div>
  );
};

export default Index;
