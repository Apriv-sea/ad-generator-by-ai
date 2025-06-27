
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthTokenHandler } from "@/hooks/useAuthTokenHandler";
import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";

const Index = () => {
  const { isAuthenticated } = useAuth();
  const { authError } = useAuthTokenHandler();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-xl font-bold text-slate-900">
              Ad Content Generator
            </Link>
            {!isAuthenticated && (
              <Button onClick={() => window.location.href = "/auth"} variant="outline">
                Connexion
              </Button>
            )}
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
