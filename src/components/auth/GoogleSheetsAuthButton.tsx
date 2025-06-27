
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader } from "lucide-react";
import { GoogleSheetsAuthService } from '@/services/googlesheets/googleSheetsAuthService';
import { toast } from 'sonner';

interface GoogleSheetsAuthButtonProps {
  onAuthStart?: () => void;
  disabled?: boolean;
}

const GoogleSheetsAuthButton: React.FC<GoogleSheetsAuthButtonProps> = ({ 
  onAuthStart,
  disabled = false 
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async () => {
    if (disabled) return;
    
    setIsLoading(true);
    
    try {
      console.log('🚀 Démarrage authentification Google Sheets...');
      console.log('🌐 URL complète:', window.location.href);
      console.log('🌐 Origin:', window.location.origin);
      
      onAuthStart?.();
      
      const authUrl = await GoogleSheetsAuthService.initiateAuth();
      console.log('✅ URL d\'authentification générée:', authUrl);
      
      // Redirection directe au lieu d'une popup
      console.log('🔄 Redirection vers Google...');
      window.location.href = authUrl;
      
    } catch (error) {
      console.error('❌ Erreur authentification:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Erreur lors de l'authentification: ${errorMessage}`);
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleAuth}
      disabled={disabled || isLoading}
      className="w-full"
      size="lg"
    >
      {isLoading ? (
        <>
          <Loader className="h-4 w-4 mr-2 animate-spin" />
          Redirection vers Google...
        </>
      ) : (
        <>
          <ExternalLink className="h-4 w-4 mr-2" />
          Se connecter à Google Sheets
        </>
      )}
    </Button>
  );
};

export default GoogleSheetsAuthButton;
