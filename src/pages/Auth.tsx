
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";
import AuthLoading from "@/components/auth/AuthLoading";
import AuthError from "@/components/auth/AuthError";
import AuthDebugDialog from "@/components/AuthDebugDialog";
import { Button } from "@/components/ui/button";
import GoogleAuthWarning from "@/components/auth/GoogleAuthWarning";

const Auth = () => {
  const location = useLocation();
  const { user, isAuthenticated, processAuthTokens, isLoading } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState("login");
  const [processingAuth, setProcessingAuth] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showGoogleWarning, setShowGoogleWarning] = useState(false);
  
  // Check for URL tokens on component mount
  useEffect(() => {
    const checkUrlForTokens = async () => {
      try {
        console.log("Auth page: Checking for tokens in URL...");
        setAuthError(null);
        setProcessingAuth(true);
        
        // Check if there's a hash with tokens in the URL
        if (window.location.hash && window.location.hash.includes('access_token')) {
          console.log("Auth page: Found access_token in URL hash");
          
          const tokenProcessed = await processAuthTokens();
          if (tokenProcessed) {
            console.log("Auth page: Token processed successfully");
            toast.success("Authentification réussie!");
            
            // Clean the URL
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Redirect to dashboard after successful auth
            setTimeout(() => navigate("/dashboard"), 500);
          } else {
            console.error("Auth page: Failed to process token");
            setAuthError("Échec du traitement du jeton d'authentification.");
          }
        } else if (location.search && location.search.includes('error')) {
          // Extract error from query params
          const params = new URLSearchParams(location.search);
          const error = params.get('error');
          const errorDesc = params.get('error_description');
          console.error(`Auth page: OAuth error - ${error}: ${errorDesc}`);
          
          // Detect the specific Google unverified app error
          if (errorDesc?.includes('not verified') || errorDesc?.includes('validation') || error === 'access_denied') {
            setShowGoogleWarning(true);
          } else {
            setAuthError(`Erreur Google OAuth: ${error}. ${errorDesc || ''}`);
          }
        }
      } catch (error) {
        console.error("Auth page error:", error);
        setAuthError(`Une erreur s'est produite: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setProcessingAuth(false);
      }
    };
    
    checkUrlForTokens();
  }, [location, processAuthTokens, navigate]);
  
  // Rediriger si déjà connecté
  if (isAuthenticated && !processingAuth) {
    return <Navigate to="/dashboard" />;
  }

  const handleTryAgain = () => {
    setShowGoogleWarning(false);
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="container max-w-md">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Ad Content Generator</CardTitle>
            <CardDescription className="text-center">
              Connectez-vous pour accéder à vos campagnes Google Ads
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {showGoogleWarning && (
              <GoogleAuthWarning onContinue={handleTryAgain} />
            )}
            
            {authError && !showGoogleWarning && <AuthError error={authError} />}
            
            {processingAuth || isLoading ? (
              <AuthLoading />
            ) : (
              <>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-2 mb-4">
                    <TabsTrigger value="login">Connexion</TabsTrigger>
                    <TabsTrigger value="signup">Inscription</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login">
                    <LoginForm />
                  </TabsContent>
                  
                  <TabsContent value="signup">
                    <SignupForm setActiveTab={setActiveTab} />
                  </TabsContent>
                </Tabs>
                
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Ou continuer avec
                    </span>
                  </div>
                </div>
                
                <GoogleLoginButton />
              </>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4 text-center text-xs text-muted-foreground">
            <p>En continuant, vous acceptez nos Conditions d'utilisation et notre Politique de confidentialité.</p>
            <AuthDebugDialog 
              trigger={<Button variant="ghost" size="sm" className="text-xs">Débogage d'authentification</Button>}
            />
          </CardFooter>
        </Card>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Retourner à la <a href="/" className="text-primary hover:underline">page d'accueil</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
