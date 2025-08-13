/**
 * API Key Migration and Setup Helper Component
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Key, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { EncryptedApiKeyService } from '@/services/security/encryptedApiKeyService';
import { SecureLLMService } from '@/services/llm/secureLLMService';

interface ApiKeyStatus {
  provider: string;
  hasKey: boolean;
  isEncrypted: boolean;
  lastUpdated?: string;
}

export function ApiKeyMigrationHelper() {
  const [apiKeys, setApiKeys] = useState<{ [key: string]: string }>({
    anthropic: '',
    openai: '',
    google: ''
  });
  const [keyStatuses, setKeyStatuses] = useState<ApiKeyStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Check current key status
  const checkKeyStatuses = async () => {
    setIsChecking(true);
    try {
      const providers = ['anthropic', 'openai', 'google'];
      const statuses: ApiKeyStatus[] = [];

      for (const provider of providers) {
        const hasKey = await SecureLLMService.hasValidAPIKey(provider as any);
        const encryptedKey = await EncryptedApiKeyService.getDecrypted(provider);
        
        statuses.push({
          provider,
          hasKey,
          isEncrypted: !!encryptedKey
        });
      }

      setKeyStatuses(statuses);
    } catch (error) {
      console.error('Error checking key statuses:', error);
      toast.error('Erreur lors de la vérification des clés API');
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkKeyStatuses();
  }, []);

  // Save API key with encryption
  const saveApiKey = async (provider: string) => {
    const key = apiKeys[provider];
    if (!key?.trim()) {
      toast.error('Veuillez saisir une clé API valide');
      return;
    }

    setIsLoading(true);
    try {
      await EncryptedApiKeyService.storeEncrypted(provider, key.trim());
      
      // Clear the input
      setApiKeys(prev => ({ ...prev, [provider]: '' }));
      
      // Refresh status
      await checkKeyStatuses();
      
      toast.success(`Clé ${provider} sauvegardée avec succès`);
    } catch (error) {
      console.error('Error saving API key:', error);
      toast.error(`Erreur lors de la sauvegarde de la clé ${provider}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Migrate legacy keys
  const migrateKeys = async () => {
    setIsLoading(true);
    try {
      const providers = ['anthropic', 'openai', 'google'];
      let migrated = 0;

      for (const provider of providers) {
        try {
          await EncryptedApiKeyService.migrateToEncrypted(provider);
          migrated++;
        } catch (error) {
          console.warn(`No legacy key found for ${provider}`);
        }
      }

      if (migrated > 0) {
        toast.success(`${migrated} clé(s) migrée(s) vers le stockage chiffré`);
        await checkKeyStatuses();
      } else {
        toast.info('Aucune clé à migrer');
      }
    } catch (error) {
      console.error('Error migrating keys:', error);
      toast.error('Erreur lors de la migration des clés');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: ApiKeyStatus) => {
    if (status.hasKey && status.isEncrypted) {
      return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Configurée</Badge>;
    } else if (status.hasKey && !status.isEncrypted) {
      return <Badge variant="secondary"><AlertTriangle className="w-3 h-3 mr-1" />Non chiffrée</Badge>;
    } else {
      return <Badge variant="destructive">Manquante</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          Configuration des Clés API
        </CardTitle>
        <CardDescription>
          Configurez vos clés API pour utiliser l'assistant IA. Toutes les clés sont stockées de manière chiffrée.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Status Overview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">État actuel des clés API</h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={checkKeyStatuses}
              disabled={isChecking}
            >
              {isChecking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Actualiser
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {keyStatuses.map((status) => (
              <div key={status.provider} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium capitalize">{status.provider}</h4>
                  <p className="text-sm text-muted-foreground">
                    {status.provider === 'anthropic' ? 'Claude' : 
                     status.provider === 'openai' ? 'GPT' : 'Gemini'}
                  </p>
                </div>
                {getStatusBadge(status)}
              </div>
            ))}
          </div>

          {/* Migration Alert */}
          {keyStatuses.some(s => s.hasKey && !s.isEncrypted) && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Des clés API non chiffrées ont été détectées. 
                <Button variant="link" className="p-0 h-auto ml-2" onClick={migrateKeys}>
                  Migrer vers le stockage chiffré
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* API Key Configuration */}
        <Tabs defaultValue="anthropic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="anthropic">Anthropic (Claude)</TabsTrigger>
            <TabsTrigger value="openai">OpenAI (GPT)</TabsTrigger>
            <TabsTrigger value="google">Google (Gemini)</TabsTrigger>
          </TabsList>
          
          <TabsContent value="anthropic" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="anthropic-key">Clé API Anthropic</Label>
                <Input
                  id="anthropic-key"
                  type="password"
                  value={apiKeys.anthropic}
                  onChange={(e) => setApiKeys(prev => ({ ...prev, anthropic: e.target.value }))}
                  placeholder="sk-ant-..."
                />
              </div>
              <Button 
                onClick={() => saveApiKey('anthropic')} 
                disabled={isLoading || !apiKeys.anthropic.trim()}
              >
                Sauvegarder la clé Anthropic
              </Button>
              <p className="text-sm text-muted-foreground">
                <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Obtenez votre clé API Anthropic ici
                </a>
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="openai" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="openai-key">Clé API OpenAI</Label>
                <Input
                  id="openai-key"
                  type="password"
                  value={apiKeys.openai}
                  onChange={(e) => setApiKeys(prev => ({ ...prev, openai: e.target.value }))}
                  placeholder="sk-..."
                />
              </div>
              <Button 
                onClick={() => saveApiKey('openai')} 
                disabled={isLoading || !apiKeys.openai.trim()}
              >
                Sauvegarder la clé OpenAI
              </Button>
              <p className="text-sm text-muted-foreground">
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Obtenez votre clé API OpenAI ici
                </a>
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="google" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="google-key">Clé API Google</Label>
                <Input
                  id="google-key"
                  type="password"
                  value={apiKeys.google}
                  onChange={(e) => setApiKeys(prev => ({ ...prev, google: e.target.value }))}
                  placeholder="AIza..."
                />
              </div>
              <Button 
                onClick={() => saveApiKey('google')} 
                disabled={isLoading || !apiKeys.google.trim()}
              >
                Sauvegarder la clé Google
              </Button>
              <p className="text-sm text-muted-foreground">
                <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Obtenez votre clé API Google ici
                </a>
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}