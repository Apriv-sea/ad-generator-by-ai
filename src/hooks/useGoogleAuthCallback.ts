
import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useGoogleSheets } from '@/contexts/GoogleSheetsContext';
import { toast } from 'sonner';

export const useGoogleAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { completeAuth } = useGoogleSheets();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const state = searchParams.get('state');

      console.log('=== CALLBACK GOOGLE SHEETS ===');
      console.log('Code:', code ? `${code.substring(0, 20)}...` : 'null');
      console.log('Error:', error);
      console.log('State:', state);
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
          // Rediriger vers /campaigns avec un message d'erreur
          navigate('/campaigns?auth_error=' + encodeURIComponent(errorMessage));
        }
        return;
      }

      if (code) {
        console.log('Code d\'authentification reçu, traitement...');
        
        try {
          // Compléter l'authentification
          await completeAuth(code, state || '');
          
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
            }, 1000);
          } else {
            // Si pas de fenêtre parent, rediriger vers /campaigns
            toast.success('Authentification Google Sheets réussie !');
            navigate('/campaigns?auth_success=true');
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
            toast.error(`Erreur d'authentification: ${errorMessage}`);
            navigate('/campaigns?auth_error=' + encodeURIComponent(errorMessage));
          }
        }
      } else {
        console.log('Aucun code ou erreur trouvé dans l\'URL');
        if (!window.opener) {
          navigate('/campaigns');
        }
      }
    };

    handleCallback();
  }, [searchParams, completeAuth, navigate]);
};
