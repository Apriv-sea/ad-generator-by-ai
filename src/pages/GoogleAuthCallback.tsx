
import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const GoogleAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('Erreur authentification Google:', error);
      window.close();
      return;
    }

    if (code) {
      // Envoyer le code à la fenêtre parent
      if (window.opener) {
        window.opener.postMessage({
          type: 'GOOGLE_AUTH_SUCCESS',
          code: code
        }, window.location.origin);
        window.close();
      }
    }
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Authentification en cours...</h2>
        <p className="text-gray-600">Cette fenêtre va se fermer automatiquement.</p>
      </div>
    </div>
  );
};

export default GoogleAuthCallback;
