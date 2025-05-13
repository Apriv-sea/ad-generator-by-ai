
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ExternalLink, CheckCircle } from 'lucide-react';
import AuthDebugDialog from '@/components/AuthDebugDialog';
import { toast } from 'sonner';

const LocalhostRedirect = () => {
  const [deployedUrl, setDeployedUrl] = useState<string | null>(null);
  const [inputUrl, setInputUrl] = useState<string>('');
  const [redirecting, setRedirecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [tokenInfo, setTokenInfo] = useState<{
    type: string;
    source: string;
    hasAccessToken: boolean;
  } | null>(null);
  const navigate = useNavigate();

  // Extract token and query parameters
  const [tokenParams, setTokenParams] = useState<string | null>(null);

  useEffect(() => {
    // Check if we're on localhost
    if (window.location.hostname === 'localhost') {
      // First try to get the deployed URL from local storage
      const storedDeployedUrl = localStorage.getItem('deployed_url');
      if (storedDeployedUrl) {
        setDeployedUrl(storedDeployedUrl);
        setInputUrl(storedDeployedUrl);
      }

      // Extract token information from URL
      let tokenInfo = '';
      let tokenType = 'unknown';
      let tokenSource = 'unknown';
      let hasAccessToken = false;
      
      // Check hash for access_token (Supabase auth)
      if (window.location.hash && window.location.hash.includes('access_token')) {
        console.log("Found access token in URL hash");
        tokenInfo = window.location.hash;
        tokenType = window.location.hash.includes('type=signup') ? 'inscription' : 'connexion';
        tokenSource = 'hash';
        hasAccessToken = true;
        setTokenParams(tokenInfo);
        
        setTokenInfo({
          type: tokenType,
          source: tokenSource,
          hasAccessToken: hasAccessToken
        });
      } 
      // Check search params (query string)
      else if (window.location.search) {
        console.log("Found query parameters in URL");
        tokenInfo = window.location.search;
        tokenType = 'paramètres';
        tokenSource = 'search';
        hasAccessToken = false;
        setTokenParams(tokenInfo);
        
        setTokenInfo({
          type: tokenType,
          source: tokenSource,
          hasAccessToken: hasAccessToken
        });
      }
      
      if (!tokenInfo) {
        setErrorMsg("Aucun jeton d'authentification trouvé dans l'URL.");
      }
      
      // If we have a deployed URL stored and a token, suggest auto-redirect
      if (storedDeployedUrl && tokenInfo && !redirecting) {
        toast.info("Une redirection automatique est recommandée pour compléter l'authentification.", {
          duration: 10000,
          action: {
            label: "Rediriger",
            onClick: () => handleRedirect()
          }
        });
      }
    } else {
      // Not on localhost, redirect to the root
      navigate('/');
    }
  }, [navigate]);

  const handleSaveUrl = () => {
    // Validate URL format
    try {
      const url = new URL(inputUrl);
      // Remove trailing slash if present
      const cleanUrl = url.toString().replace(/\/$/, "");
      
      localStorage.setItem('deployed_url', cleanUrl);
      setDeployedUrl(cleanUrl);
      setErrorMsg(null);
      toast.success("URL enregistrée avec succès");
    } catch (e) {
      setErrorMsg("URL invalide. Veuillez entrer une URL complète (avec https://)");
    }
  };

  const handleRedirect = () => {
    if (!deployedUrl || !tokenParams) return;
    
    setRedirecting(true);
    toast.loading("Redirection en cours...");
    
    // Build the new URL - carefully handling the parameters
    // If tokenParams starts with # or ?, we pass it as is
    const newUrl = `${deployedUrl}${tokenParams}`;
    
    console.log("Redirection vers:", newUrl);
    
    // Redirect to the deployed URL with all auth parameters
    window.location.href = newUrl;
  };

  const handleClearConfig = () => {
    localStorage.removeItem('deployed_url');
    setDeployedUrl(null);
    setInputUrl('');
    toast.info("Configuration effacée");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Redirection de confirmation d'email</CardTitle>
          <CardDescription>
            Votre navigateur a été redirigé vers localhost après la confirmation de votre email. 
            Pour terminer le processus, vous devez être redirigé vers votre application déployée.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {errorMsg && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}

          <div className="bg-amber-50 p-4 rounded-md">
            <h3 className="font-medium mb-1">Information importante</h3>
            <p className="text-sm">
              Vous avez été redirigé vers localhost après la confirmation de votre email.
              Pour compléter le processus d'inscription, vous devez être redirigé vers votre application déployée.
            </p>
            {tokenInfo?.hasAccessToken && (
              <div className="mt-2 flex items-center gap-2 text-xs text-green-700">
                <CheckCircle className="h-4 w-4" />
                <p>Un jeton d'authentification a été détecté ({tokenInfo.type}) et sera transmis à l'URL déployée.</p>
              </div>
            )}
          </div>

          {!deployedUrl ? (
            <div className="space-y-4">
              <Label htmlFor="deployed-url">URL de votre application déployée</Label>
              <div className="flex space-x-2">
                <Input 
                  id="deployed-url"
                  type="text" 
                  placeholder="https://votre-app.lovable.app" 
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                />
                <Button onClick={handleSaveUrl}>Enregistrer</Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Par exemple: https://votre-app.lovable.app (sans barre oblique finale /)
              </p>
            </div>
          ) : (
            <>
              <div className="bg-slate-100 p-3 rounded-md">
                <p className="font-medium">URL de redirection:</p>
                <p className="text-sm break-all mt-1 flex items-center">
                  {deployedUrl}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="ml-2 h-6 w-6 p-0" 
                    onClick={() => window.open(deployedUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </p>
              </div>

              <Button 
                onClick={handleRedirect} 
                className="w-full" 
                disabled={redirecting || !tokenParams}
              >
                {redirecting ? 'Redirection en cours...' : 'Rediriger avec les jetons d\'authentification'}
              </Button>
              
              <Button variant="outline" onClick={handleClearConfig} className="w-full">
                Modifier l'URL déployée
              </Button>
            </>
          )}

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => navigate("/auth")}>
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
