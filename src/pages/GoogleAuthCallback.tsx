
import React from 'react';
import { useGoogleAuthCallback } from '@/hooks/useGoogleAuthCallback';

const GoogleAuthCallback: React.FC = () => {
  useGoogleAuthCallback();

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
