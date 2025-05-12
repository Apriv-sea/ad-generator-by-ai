
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";

const Settings = () => {
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [googleKey, setGoogleKey] = useState("");
  
  const saveApiKey = (service: string, key: string) => {
    // Cette fonction sera améliorée pour stocker les clés de manière sécurisée
    localStorage.setItem(`${service.toLowerCase()}_api_key`, key);
    toast.success(`Clé API ${service} sauvegardée avec succès!`);
  };

  return (
    <>
      <Navigation />
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Paramètres API</h1>
        
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
                </div>
                <Button onClick={() => saveApiKey("OpenAI", openaiKey)}>Sauvegarder</Button>
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
                </div>
                <Button onClick={() => saveApiKey("Anthropic", anthropicKey)}>Sauvegarder</Button>
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
                </div>
                <Button onClick={() => saveApiKey("Google", googleKey)}>Sauvegarder</Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Settings;
