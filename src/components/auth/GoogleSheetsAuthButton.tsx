
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader, AlertTriangle } from "lucide-react";
import { googleSheetsCoreService } from '@/services/core/googleSheetsCore';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface GoogleSheetsAuthButtonProps {
  onAuthStart?: () => void;
  disabled?: boolean;
}

const GoogleSheetsAuthButton: React.FC<GoogleSheetsAuthButtonProps> = ({ 
  onAuthStart,
  disabled = false 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated, user, session } = useAuth();

  const handleAuth = async () => {
    if (disabled) return;
    
    setIsLoading(true);
    
    try {
      console.log('🚀 === CLIC BOUTON AUTHENTIFICATION ===');
      console.log('🔐 État d\'authentification Supabase:', {
        isAuthenticated,
        hasUser: !!user,
        hasSession: !!session,
        userId: user?.id
      });
      
      if (!isAuthenticated || !user) {
        throw new Error('Vous devez être connecté à l\'application avant de vous connecter à Google Sheets');
      }
      
      console.log('🌐 Contexte:', {
        userAgent: navigator.userAgent,
        url: window.location.href,
        origin: window.location.origin,
        timestamp: new Date().toISOString()
      });
      
      onAuthStart?.();
      
      console.log('📞 Appel de GoogleSheetsAuthService.initiateAuth()...');
      const authUrl = await googleSheetsCoreService.initiateAuth();
      console.log('✅ URL d\'authentification reçue:', authUrl);
      
      // Validation de l'URL
      if (!authUrl || !authUrl.startsWith('https://accounts.google.com/')) {
        throw new Error('URL d\'authentification invalide reçue du serveur');
      }
      
      console.log('🔄 === REDIRECTION VERS GOOGLE ===');
      console.log('URL de redirection:', authUrl);
      
      // Redirection directe
      window.location.href = authUrl;
      
    } catch (error) {
      console.error('❌ === ERREUR BOUTON AUTHENTIFICATION ===');
      console.error('Erreur complète:', error);
      
      setIsLoading(false);
      
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      
      // Messages d'erreur plus explicites
      let userMessage = `Erreur lors de l'authentification: ${errorMessage}`;
      
      if (errorMessage.includes('401')) {
        userMessage = '🔐 Erreur d\'authentification (401). Vérifiez la configuration des secrets Google Sheets dans Supabase.';
      } else if (errorMessage.includes('403')) {
        userMessage = '🚫 Accès refusé (403). Vérifiez les permissions de l\'API Google Sheets.';
      } else if (errorMessage.includes('500')) {
        userMessage = '🔥 Erreur serveur (500). Problème avec la fonction Edge Supabase.';
      } else if (errorMessage.includes('Configuration')) {
        userMessage = '⚙️ Problème de configuration. Vérifiez les secrets Supabase.';
      }
      
      toast.error(userMessage);
    }
  };

  return (
    <div className="space-y-2">
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
      
      {/* Informations de debug */}
      <div className="text-xs text-gray-500 bg-yellow-50 p-2 rounded border">
        <div className="flex items-center space-x-1 mb-1">
          <AlertTriangle className="h-3 w-3 text-yellow-600" />
          <span className="font-medium">Debug Info:</span>
        </div>
        <div>Origin: <code className="text-xs">{window.location.origin}</code></div>
        <div>Callback: <code className="text-xs">{window.location.origin}/auth/google</code></div>
      </div>
    </div>
  );
};

export default GoogleSheetsAuthButton;
