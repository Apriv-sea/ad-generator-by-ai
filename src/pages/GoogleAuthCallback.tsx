
import React, { useEffect } from 'react';
import { useGoogleAuthCallback } from '@/hooks/useGoogleAuthCallback';
import { Loader2 } from 'lucide-react';

const GoogleAuthCallback: React.FC = () => {
  useGoogleAuthCallback();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Authentification en cours...</h2>
        <p className="text-gray-600">Veuillez patienter pendant que nous finalisons votre connexion Google Sheets.</p>
      </div>
    </div>
  );
};

export default GoogleAuthCallback;
