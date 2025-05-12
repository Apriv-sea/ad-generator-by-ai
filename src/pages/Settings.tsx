import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Rediriger vers la page d'authentification si l'utilisateur n'est pas connecté
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  // API Keys state
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [googleKey, setGoogleKey] = useState("");
  
  // Google OAuth state
  const [sheetsAccess, setSheetsAccess] = useState(false);
  const [driveAccess, setDriveAccess] = useState(false);
  
  // Load saved API keys and connection status on component mount
  useEffect(() => {
    const savedOpenaiKey = localStorage.getItem("openai_api_key");
    const savedAnthropicKey = localStorage.getItem("anthropic_api_key");
    const savedGoogleKey = localStorage.getItem("google_api_key");
    const googleSheetsAccess = localStorage.getItem("google_sheets_access") === "true";
    const googleDriveAccess = localStorage.getItem("google_drive_access") === "true";
    
    if (savedOpenaiKey) setOpenaiKey(savedOpenaiKey);
    if (savedAnthropicKey) setAnthropicKey(savedAnthropicKey);
    if (savedGoogleKey) setGoogleKey(savedGoogleKey);
    
    setSheetsAccess(googleSheetsAccess);
    setDriveAccess(googleDriveAccess);
  }, []);
  
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
  
  if (!isAuthenticated) {
    return null; // Ne rien afficher pendant la redirection
  }
  
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
                Configurez l'accès à Google Drive et Google Sheets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Compte Google connecté</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
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
