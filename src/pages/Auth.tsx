
import React, { useState, useEffect } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import AuthLoading from "@/components/auth/AuthLoading";
import AuthError from "@/components/auth/AuthError";
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";
import EmailAuthWarning from "@/components/auth/GoogleAuthWarning";
import { Link } from "react-router-dom";

const Auth = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, processAuthTokens, isLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState("login");
  const [processingAuth, setProcessingAuth] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showAuthWarning, setShowAuthWarning] = useState(false);
  
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
          console.error(`Auth page: Auth error - ${error}: ${errorDesc}`);
          
          // Detect specific authentication errors
          if (errorDesc?.includes('not verified') || errorDesc?.includes('validation') || error === 'access_denied') {
            setShowAuthWarning(true);
          } else {
            setAuthError(`Erreur d'authentification: ${error}. ${errorDesc || ''}`);
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
  
  // Redirect if already authenticated
  if (isAuthenticated && !processingAuth) {
    return <Navigate to="/dashboard" />;
  }

  const handleTryAgain = () => {
    setShowAuthWarning(false);
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-50 to-indigo-50 p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-500 text-white p-6">
            <CardTitle className="text-2xl font-bold text-center mb-1">Ad Content Generator</CardTitle>
            <CardDescription className="text-white/80 text-center">
              Connectez-vous pour gérer vos campagnes publicitaires
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6 pt-8">
            {showAuthWarning && (
              <EmailAuthWarning onContinue={handleTryAgain} />
            )}
            
            {authError && !showAuthWarning && (
              <AuthError error={authError} />
            )}
            
            {processingAuth || isLoading ? (
              <AuthLoading />
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-2 mb-6">
                  <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                    Connexion
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                    Inscription
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <LoginForm />
                </TabsContent>
                
                <TabsContent value="signup">
                  <SignupForm setActiveTab={setActiveTab} />
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4 border-t p-6 bg-gray-50">
            <p className="text-center text-xs text-muted-foreground">
              En continuant, vous acceptez nos Conditions d'utilisation et notre{" "}
              <Link to="/privacy-policy" className="text-primary hover:underline font-medium">
                Politique de confidentialité
              </Link>
            </p>
            
            <p className="text-xs text-center text-muted-foreground">
              <Link to="/" className="text-primary hover:underline">
                Retour à l'accueil
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
