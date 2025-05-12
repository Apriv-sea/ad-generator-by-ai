
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader } from "lucide-react";
import AuthDebugDialog from "@/components/AuthDebugDialog";

const Auth = () => {
  const location = useLocation();
  const { user, isAuthenticated, login, signup, googleLogin, processAuthTokens, isLoading } = useAuth();
  const navigate = useNavigate();
  
  // États pour le formulaire
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState("login");
  const [processingAuth, setProcessingAuth] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
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
          setAuthError(`Erreur Google OAuth: ${error}. ${errorDesc || ''}`);
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
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    
    if (!email || !password) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    
    try {
      setProcessingAuth(true);
      await login(email, password);
      navigate("/dashboard");
    } catch (error) {
      console.error("Erreur de connexion:", error);
      setAuthError(error instanceof Error ? error.message : "Erreur d'authentification");
    } finally {
      setProcessingAuth(false);
    }
  };
  
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    
    if (!email || !password) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    
    if (password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    
    try {
      setProcessingAuth(true);
      await signup(email, password);
      setActiveTab("login");
      toast.success("Compte créé avec succès! Veuillez vérifier votre email.");
    } catch (error) {
      console.error("Erreur d'inscription:", error);
      setAuthError(error instanceof Error ? error.message : "Erreur lors de l'inscription");
    } finally {
      setProcessingAuth(false);
    }
  };
  
  const handleGoogleLogin = async () => {
    setAuthError(null);
    try {
      setProcessingAuth(true);
      await googleLogin();
      // No need to navigate, the OAuth flow will redirect
    } catch (error) {
      console.error("Erreur de connexion Google:", error);
      setAuthError("Échec de l'initialisation de la connexion Google");
      setProcessingAuth(false);
    }
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
            {authError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            )}
            
            {processingAuth || isLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader className="h-8 w-8 animate-spin text-primary mb-4" />
                <p>Traitement de l'authentification...</p>
              </div>
            ) : (
              <>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-2 mb-4">
                    <TabsTrigger value="login">Connexion</TabsTrigger>
                    <TabsTrigger value="signup">Inscription</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="votre@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="password">Mot de passe</Label>
                          <a href="#" className="text-xs text-primary hover:underline">
                            Mot de passe oublié ?
                          </a>
                        </div>
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                      
                      <Button type="submit" className="w-full" disabled={processingAuth}>
                        Se connecter
                      </Button>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="signup">
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="votre@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Mot de passe</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Le mot de passe doit contenir au moins 6 caractères
                        </p>
                      </div>
                      
                      <Button type="submit" className="w-full" disabled={processingAuth}>
                        S'inscrire
                      </Button>
                    </form>
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
                
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleGoogleLogin} 
                  disabled={processingAuth}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" className="h-5 w-5 mr-2">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    <path d="M1 1h22v22H1z" fill="none" />
                  </svg>
                  Google
                </Button>
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
