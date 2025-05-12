
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";

const Settings = () => {
  // API Keys state
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [googleKey, setGoogleKey] = useState("");
  
  // Google OAuth state
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [sheetsAccess, setSheetsAccess] = useState(false);
  const [driveAccess, setDriveAccess] = useState(false);
  
  // Load saved API keys and connection status on component mount
  useEffect(() => {
    const savedOpenaiKey = localStorage.getItem("openai_api_key");
    const savedAnthropicKey = localStorage.getItem("anthropic_api_key");
    const savedGoogleKey = localStorage.getItem("google_api_key");
    const googleConnected = localStorage.getItem("google_connected") === "true";
    const googleSheetsAccess = localStorage.getItem("google_sheets_access") === "true";
    const googleDriveAccess = localStorage.getItem("google_drive_access") === "true";
    
    if (savedOpenaiKey) setOpenaiKey(savedOpenaiKey);
    if (savedAnthropicKey) setAnthropicKey(savedAnthropicKey);
    if (savedGoogleKey) setGoogleKey(savedGoogleKey);
    
    setIsGoogleConnected(googleConnected);
    setSheetsAccess(googleSheetsAccess);
    setDriveAccess(googleDriveAccess);
  }, []);

  // Handle Google OAuth connection
  const initiateGoogleAuth = () => {
    // Dans une vraie implémentation, nous utiliserions la Google OAuth API
    // Pour cette démonstration, simulons une connexion réussie
    
    setTimeout(() => {
      setIsGoogleConnected(true);
      setSheetsAccess(true);
      setDriveAccess(true);
      
      localStorage.setItem("google_connected", "true");
      localStorage.setItem("google_sheets_access", "true");
      localStorage.setItem("google_drive_access", "true");
      
      toast.success("Connecté à Google avec succès!");
    }, 1000);
  };
  
  const disconnectGoogle = () => {
    setIsGoogleConnected(false);
    setSheetsAccess(false);
    setDriveAccess(false);
    
    localStorage.removeItem("google_connected");
    localStorage.removeItem("google_sheets_access");
    localStorage.removeItem("google_drive_access");
    
    toast.success("Déconnecté de Google avec succès!");
  };
  
  const toggleSheetsAccess = () => {
    const newValue = !sheetsAccess;
    setSheetsAccess(newValue);
    localStorage.setItem("google_sheets_access", newValue.toString());
    
    if (newValue) {
      toast.success("Accès à Google Sheets activé");
    } else {
      toast.info("Accès à Google Sheets désactivé");
    }
  };
  
  const toggleDriveAccess = () => {
    const newValue = !driveAccess;
    setDriveAccess(newValue);
    localStorage.setItem("google_drive_access", newValue.toString());
    
    if (newValue) {
      toast.success("Accès à Google Drive activé");
    } else {
      toast.info("Accès à Google Drive désactivé");
    }
  };
  
  // Save API Key functions
  const saveApiKey = (service: string, key: string) => {
    if (!key.trim()) {
      toast.error(`La clé API ${service} ne peut pas être vide.`);
      return;
    }
    
    localStorage.setItem(`${service.toLowerCase()}_api_key`, key);
    toast.success(`Clé API ${service} sauvegardée avec succès!`);
    
    // Simuler une validation de la clé
    validateApiKey(service, key);
  };
  
  const validateApiKey = (service: string, key: string) => {
    // Dans une vraie implémentation, nous vérifierions la validité des clés
    // Pour cette démonstration, simulons une validation
    
    toast.info(`Validation de la clé API ${service}...`);
    
    setTimeout(() => {
      toast.success(`Clé API ${service} validée avec succès!`);
    }, 1500);
  };
  
  return (
    <>
      <Navigation />
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Paramètres</h1>
        
        <div className="space-y-8">
          {/* Section Google OAuth */}
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Connexion Google</CardTitle>
              <CardDescription>
                Connectez votre compte Google pour accéder à Google Drive et Google Sheets
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isGoogleConnected ? (
                <Button onClick={initiateGoogleAuth} className="flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" className="mr-1">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Connecter avec Google
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Compte Google connecté</p>
                      <p className="text-sm text-muted-foreground">Accès à vos documents Google</p>
                    </div>
                    <Button variant="destructive" onClick={disconnectGoogle}>
                      Déconnecter
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="sheets-access">Google Sheets</Label>
                        <p className="text-sm text-muted-foreground">Accès pour lire/écrire dans vos feuilles de calcul</p>
                      </div>
                      <Switch 
                        id="sheets-access" 
                        checked={sheetsAccess}
                        onCheckedChange={toggleSheetsAccess}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="drive-access">Google Drive</Label>
                        <p className="text-sm text-muted-foreground">Accès pour gérer vos documents</p>
                      </div>
                      <Switch 
                        id="drive-access" 
                        checked={driveAccess}
                        onCheckedChange={toggleDriveAccess}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Section LLM API Keys */}
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Configuration des clés API</CardTitle>
              <CardDescription>
                Configurez au moins une clé API pour pouvoir générer du contenu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="openai">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="openai">OpenAI</TabsTrigger>
                  <TabsTrigger value="anthropic">Anthropic</TabsTrigger>
                  <TabsTrigger value="google">Google Gemini</TabsTrigger>
                </TabsList>
                
                <TabsContent value="openai" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="openai-key">Clé API OpenAI</Label>
                    <Input
                      id="openai-key"
                      type="password"
                      placeholder="sk-..."
                      value={openaiKey}
                      onChange={(e) => setOpenaiKey(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Commençant par "sk-". Trouvez votre clé sur <a href="https://platform.openai.com/account/api-keys" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">platform.openai.com</a>
                    </p>
                  </div>
                  <Button onClick={() => saveApiKey("openai", openaiKey)}>Sauvegarder</Button>
                </TabsContent>
                
                <TabsContent value="anthropic" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="anthropic-key">Clé API Anthropic</Label>
                    <Input
                      id="anthropic-key"
                      type="password"
                      placeholder="sk_ant-..."
                      value={anthropicKey}
                      onChange={(e) => setAnthropicKey(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Commençant par "sk_ant-". Trouvez votre clé sur <a href="https://console.anthropic.com/settings/keys" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">console.anthropic.com</a>
                    </p>
                  </div>
                  <Button onClick={() => saveApiKey("anthropic", anthropicKey)}>Sauvegarder</Button>
                </TabsContent>
                
                <TabsContent value="google" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="google-key">Clé API Google Gemini</Label>
                    <Input
                      id="google-key"
                      type="password"
                      placeholder="AI..."
                      value={googleKey}
                      onChange={(e) => setGoogleKey(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Trouvez votre clé sur <a href="https://aistudio.google.com/app/apikey" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">AI Studio Google</a>
                    </p>
                  </div>
                  <Button onClick={() => saveApiKey("google", googleKey)}>Sauvegarder</Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Settings;
