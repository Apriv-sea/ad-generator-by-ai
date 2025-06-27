
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGoogleSheets } from '@/contexts/GoogleSheetsContext';

export const useGoogleAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const { completeAuth } = useGoogleSheets();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('Erreur authentification Google:', error);
      if (window.opener) {
        window.opener.postMessage({
          type: 'GOOGLE_AUTH_ERROR',
          error: error
        }, window.location.origin);
        window.close();
      }
      return;
    }

    if (code) {
      // Compléter l'authentification
      completeAuth(code).then(() => {
        // Envoyer le succès à la fenêtre parent
        if (window.opener) {
          window.opener.postMessage({
            type: 'GOOGLE_AUTH_SUCCESS',
            code: code
          }, window.location.origin);
          window.close();
        }
      }).catch((error) => {
        console.error('Erreur lors de la completion auth:', error);
        if (window.opener) {
          window.opener.postMessage({
            type: 'GOOGLE_AUTH_ERROR',
            error: error.message
          }, window.location.origin);
          window.close();
        }
      });
    }
  }, [searchParams, completeAuth]);
};
