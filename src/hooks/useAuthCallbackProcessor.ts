
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { googleAuthService } from '@/services/google/googleAuthService';
import { processAuthTokens } from '@/utils/authUtils';
import { extractUrlErrors } from '@/utils/authCallbackUtils';

interface CallbackStatus {
  type: 'loading' | 'success' | 'error';
  message: string;
}

export function useAuthCallbackProcessor() {
  const [status, setStatus] = useState<CallbackStatus>({
    type: 'loading',
    message: 'Traitement en cours...'
  });
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const navigate = useNavigate();

  const processStandardAuth = useCallback(async (): Promise<boolean> => {
    try {
      console.log("=== TRAITEMENT AUTH STANDARD ===");
      setStatus({ type: 'loading', message: 'Traitement de l\'authentification...' });
      
      const success = await processAuthTokens();
      
      if (success) {
        console.log("Authentification standard réussie");
        setStatus({ type: 'success', message: 'Authentification réussie !' });
        return true;
      } else {
        console.error("Échec de l'authentification standard");
        setStatus({ type: 'error', message: 'Échec de l\'authentification' });
        setErrorDetails('Tokens d\'authentification manquants ou invalides');
        return false;
      }
    } catch (error: any) {
      console.error('Erreur lors du traitement de l\'authentification standard:', error);
      setStatus({ type: 'error', message: 'Erreur lors de l\'authentification' });
      setErrorDetails(error.message || 'Une erreur inattendue s\'est produite');
      return false;
    }
  }, []);

  const processGoogleSheetsAuth = useCallback((): boolean => {
    try {
      console.log("=== TRAITEMENT AUTH GOOGLE SHEETS ===");
      setStatus({ type: 'loading', message: 'Traitement de l\'authentification Google Sheets...' });
      
      // Extraire les paramètres de l'URL
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');
      
      console.log("Paramètres extraits:", {
        hasCode: !!code,
        hasState: !!state,
        hasError: !!error,
        code: code?.substring(0, 20) + "...",
        state: state?.substring(0, 20) + "...",
        error
      });
      
      if (error) {
        let errorMessage = `Erreur Google: ${error}`;
        const errorDescription = urlParams.get('error_description');
        if (errorDescription) {
          errorMessage += ` - ${errorDescription}`;
        }
        
        console.error("Erreur Google OAuth:", { error, errorDescription });
        setStatus({ type: 'error', message: 'Authentification Google refusée' });
        setErrorDetails(errorMessage);
        return false;
      }
      
      if (!code || !state) {
        console.error("Paramètres OAuth manquants:", { code: !!code, state: !!state });
        setStatus({ type: 'error', message: 'Paramètres d\'authentification manquants' });
        setErrorDetails('Code d\'autorisation ou état OAuth manquant');
        return false;
      }
      
      // Traiter le callback de manière asynchrone avec gestion d'erreur améliorée
      googleAuthService.handleCallback(code, state)
        .then(success => {
          if (success) {
            console.log("Callback Google traité avec succès");
            setStatus({ type: 'success', message: 'Connexion Google Sheets réussie !' });
            // Rediriger vers la page précédente après un délai
            setTimeout(() => {
              navigate(-1);
            }, 1500);
          } else {
            console.error("Échec du traitement du callback Google");
            setStatus({ type: 'error', message: 'Échec de la connexion Google Sheets' });
            setErrorDetails('Erreur lors du traitement des tokens Google. Vérifiez la configuration OAuth.');
          }
        })
        .catch(error => {
          console.error('Erreur lors du traitement du callback Google:', error);
          
          // Messages d'erreur plus spécifiques
          let userMessage = 'Erreur lors de la connexion Google Sheets';
          let details = error.message || 'Une erreur inattendue s\'est produite';
          
          if (error.message?.includes('redirect_uri_mismatch')) {
            userMessage = 'Erreur de configuration OAuth';
            details = `URI de redirection incorrecte. Vérifiez que ${window.location.origin}/auth/callback est configuré dans Google Cloud Console.`;
          } else if (error.message?.includes('invalid_client')) {
            userMessage = 'Client ID invalide';
            details = 'Vérifiez votre configuration dans Google Cloud Console.';
          }
          
          setStatus({ type: 'error', message: userMessage });
          setErrorDetails(details);
        });
      
      return true; // Retourner true car le traitement est en cours
    } catch (error: any) {
      console.error('Erreur lors du traitement du callback Google Sheets:', error);
      setStatus({ type: 'error', message: 'Erreur lors de la connexion Google Sheets' });
      setErrorDetails(error.message || 'Une erreur inattendue s\'est produite');
      return false;
    }
  }, [navigate]);

  const checkForErrors = useCallback(() => {
    const { hasError, errorMessage } = extractUrlErrors();
    if (hasError) {
      setStatus({ type: 'error', message: 'Erreur d\'authentification détectée' });
      setErrorDetails(errorMessage || 'Erreur inconnue');
      return true;
    }
    return false;
  }, []);

  const redirectToRoot = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const goBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // Convertir les types pour la compatibilité avec AuthCallback.tsx
  const getCompatibleStatus = (): 'processing' | 'success' | 'error' => {
    switch (status.type) {
      case 'loading':
        return 'processing';
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'processing';
    }
  };

  return {
    status: getCompatibleStatus(),
    statusMessage: status.message,
    errorDetails,
    processStandardAuth,
    processGoogleSheetsAuth,
    checkForErrors,
    redirectToRoot,
    goBack
  };
}
