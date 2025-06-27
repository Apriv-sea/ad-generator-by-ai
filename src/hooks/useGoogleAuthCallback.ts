
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGoogleSheets } from '@/contexts/GoogleSheetsContext';
import { toast } from 'sonner';

export const useGoogleAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const { completeAuth } = useGoogleSheets();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      console.log('=== CALLBACK GOOGLE SHEETS ===');
      console.log('Code:', code);
      console.log('Error:', error);
      console.log('URL complète:', window.location.href);

      if (error) {
        console.error('Erreur authentification Google:', error);
        const errorMessage = `Erreur d'authentification: ${error}`;
        
        if (window.opener) {
          window.opener.postMessage({
            type: 'GOOGLE_AUTH_ERROR',
            error: errorMessage
          }, window.location.origin);
          window.close();
        } else {
          toast.error(errorMessage);
        }
        return;
      }

      if (code) {
        console.log('Code d\'authentification reçu, traitement...');
        
        try {
          // Compléter l'authentification
          await completeAuth(code);
          
          console.log('Authentification complétée avec succès');
          
          // Envoyer le succès à la fenêtre parent
          if (window.opener) {
            console.log('Envoi du message de succès à la fenêtre parent');
            window.opener.postMessage({
              type: 'GOOGLE_AUTH_SUCCESS',
              code: code
            }, window.location.origin);
            
            // Fermer la fenêtre popup après un court délai
            setTimeout(() => {
              window.close();
            }, 500);
          } else {
            // Si pas de fenêtre parent, rediriger vers /campaigns
            toast.success('Authentification Google Sheets réussie !');
            window.location.href = '/campaigns';
          }
        } catch (error) {
          console.error('Erreur lors de la completion auth:', error);
          const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
          
          if (window.opener) {
            window.opener.postMessage({
              type: 'GOOGLE_AUTH_ERROR',
              error: errorMessage
            }, window.location.origin);
            window.close();
          } else {
            toast.error(errorMessage);
          }
        }
      } else {
        console.log('Aucun code ou erreur trouvé dans l\'URL');
      }
    };

    handleCallback();
  }, [searchParams, completeAuth]);
};
