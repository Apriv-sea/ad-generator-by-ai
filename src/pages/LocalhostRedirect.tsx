
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AuthDebugDialog from '@/components/AuthDebugDialog';

const LocalhostRedirect = () => {
  const [deployedUrl, setDeployedUrl] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we're on localhost
    if (window.location.hostname === 'localhost') {
      // Try to get the deployed URL from local storage or use a default
      const storedDeployedUrl = localStorage.getItem('deployed_url');
      if (storedDeployedUrl) {
        setDeployedUrl(storedDeployedUrl);
      } else {
        // Request the deployed URL from the user
        const url = prompt('Veuillez entrer l\'URL de votre application déployée (sans / à la fin):');
        if (url) {
          localStorage.setItem('deployed_url', url);
          setDeployedUrl(url);
        }
      }
    }
  }, []);

  const handleRedirect = () => {
    if (!deployedUrl) return;
    
    setRedirecting(true);
    
    // Get the hash and parameters from the current URL
    const hashParams = window.location.hash;
    const searchParams = window.location.search;
    
    // Build the new URL
    const newUrl = `${deployedUrl}${searchParams}${hashParams}`;
    
    // Redirect to the deployed URL with all auth parameters
    window.location.href = newUrl;
  };

  const handleBackToAuth = () => {
    navigate('/auth');
  };

  const handleClearConfig = () => {
    localStorage.removeItem('deployed_url');
    setDeployedUrl(null);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Redirection localhost</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-amber-50 rounded-md">
            <p className="font-medium">Redirection vers l'application déployée requise</p>
            <p className="text-sm mt-2">
              Vous avez été redirigé vers localhost après l'authentification Google. 
              Pour compléter le processus d'authentification, vous devez être redirigé vers l'URL de l'application déployée.
            </p>
          </div>

          {deployedUrl ? (
            <>
              <div className="bg-slate-100 p-3 rounded-md">
                <p className="font-medium">URL de redirection:</p>
                <p className="text-sm break-all mt-1">{deployedUrl}</p>
              </div>

              <Button 
                onClick={handleRedirect} 
                className="w-full" 
                disabled={redirecting}
              >
                {redirecting ? 'Redirection en cours...' : `Rediriger vers ${deployedUrl}`}
              </Button>
              
              <Button variant="outline" onClick={handleClearConfig} className="w-full">
                Modifier l'URL déployée
              </Button>
            </>
          ) : (
            <p>Veuillez fournir l'URL de votre application déployée.</p>
          )}

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={handleBackToAuth}>
              Retour à la connexion
            </Button>
            <AuthDebugDialog trigger={
              <Button variant="ghost" size="sm">
                Informations de débogage
              </Button>
            } />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LocalhostRedirect;
