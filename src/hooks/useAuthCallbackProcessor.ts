
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
      setStatus({ type: 'loading', message: 'Traitement de l\'authentification...' });
      
      const success = await processAuthTokens();
      
      if (success) {
        setStatus({ type: 'success', message: 'Authentification réussie !' });
        return true;
      } else {
        setStatus({ type: 'error', message: 'Échec de l\'authentification' });
        setErrorDetails('Tokens d\'authentification manquants ou invalides');
        return false;
      }
    } catch (error) {
      console.error('Erreur lors du traitement de l\'authentification standard:', error);
      setStatus({ type: 'error', message: 'Erreur lors de l\'authentification' });
      setErrorDetails(error.message || 'Une erreur inattendue s\'est produite');
      return false;
    }
  }, []);

  const processGoogleSheetsAuth = useCallback((): boolean => {
    try {
      setStatus({ type: 'loading', message: 'Traitement de l\'authentification Google Sheets...' });
      
      // Extraire les paramètres de l'URL
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');
      
      if (error) {
        let errorMessage = `Erreur Google: ${error}`;
        const errorDescription = urlParams.get('error_description');
        if (errorDescription) {
          errorMessage += ` - ${errorDescription}`;
        }
        
        setStatus({ type: 'error', message: 'Authentification Google refusée' });
        setErrorDetails(errorMessage);
        return false;
      }
      
      if (!code || !state) {
        setStatus({ type: 'error', message: 'Paramètres d\'authentification manquants' });
        setErrorDetails('Code d\'autorisation ou état OAuth manquant');
        return false;
      }
      
      // Traiter le callback de manière asynchrone
      googleAuthService.handleCallback(code, state).then(success => {
        if (success) {
          setStatus({ type: 'success', message: 'Connexion Google Sheets réussie !' });
          // Rediriger vers la page précédente après un délai
          setTimeout(() => {
            navigate(-1);
          }, 1500);
        } else {
          setStatus({ type: 'error', message: 'Échec de la connexion Google Sheets' });
          setErrorDetails('Erreur lors du traitement des tokens Google');
        }
      }).catch(error => {
        console.error('Erreur lors du traitement du callback Google:', error);
        setStatus({ type: 'error', message: 'Erreur lors de la connexion Google Sheets' });
        setErrorDetails(error.message || 'Une erreur inattendue s\'est produite');
      });
      
      return true; // Retourner true car le traitement est en cours
    } catch (error) {
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

  return {
    status,
    errorDetails,
    processStandardAuth,
    processGoogleSheetsAuth,
    checkForErrors,
    redirectToRoot,
    goBack
  };
}
