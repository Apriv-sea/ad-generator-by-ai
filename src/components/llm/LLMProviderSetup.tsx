
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { modelDiscoveryService, type ModelInfo, type ProviderModels } from '@/services/llm/modelDiscoveryService';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentUserId } from '@/services/utils/supabaseUtils';

interface LLMProviderSetupProps {
  onModelSelected: (provider: string, model: string) => void;
  selectedProvider?: string;
  selectedModel?: string;
}

const PROVIDERS = [
  {
    id: 'openai' as const,
    name: 'OpenAI',
    description: 'GPT-4, GPT-3.5 et autres modèles OpenAI',
    keyPrefix: 'sk-',
    keyExample: 'sk-...'
  },
  {
    id: 'anthropic' as const,
    name: 'Anthropic',
    description: 'Claude Sonnet, Opus et Haiku',
    keyPrefix: 'sk-ant-',
    keyExample: 'sk-ant-...'
  },
  {
    id: 'google' as const,
    name: 'Google AI',
    description: 'Gemini Pro et autres modèles Google',
    keyPrefix: 'AIza',
    keyExample: 'AIza...'
  }
];

const LLMProviderSetup: React.FC<LLMProviderSetupProps> = ({
  onModelSelected,
  selectedProvider,
  selectedModel
}) => {
  const [currentProvider, setCurrentProvider] = useState<string>(selectedProvider || '');
  const [apiKey, setApiKey] = useState<string>('');
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [currentModel, setCurrentModel] = useState<string>(selectedModel || '');
  const [savedKeys, setSavedKeys] = useState<Record<string, boolean>>({});

  // Charger les clés API sauvegardées au montage
  useEffect(() => {
    loadSavedApiKeys();
  }, []);

  // Charger la clé API quand le provider change
  useEffect(() => {
    if (currentProvider) {
      loadApiKeyForProvider(currentProvider as 'openai' | 'anthropic' | 'google');
    }
  }, [currentProvider]);

  const loadSavedApiKeys = async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return;

      const { data: apiKeys, error } = await supabase
        .from('api_keys')
        .select('service')
        .eq('user_id', userId);

      if (error) throw error;

      const keyMap: Record<string, boolean> = {};
      apiKeys?.forEach(key => {
        keyMap[key.service] = true;
      });
      setSavedKeys(keyMap);
    } catch (error) {
      console.error('Erreur lors du chargement des clés API:', error);
    }
  };

  const loadApiKeyForProvider = async (provider: 'openai' | 'anthropic' | 'google') => {
    try {
      console.log(`🔍 Chargement de la clé API pour ${provider}...`);
      
      // Utiliser la fonction RPC pour récupérer la clé déchiffrée
      const { data: apiKeyValue, error } = await supabase
        .rpc('get_encrypted_api_key', {
          service_name: provider
        });

      if (error) {
        console.error(`❌ Erreur lors du chargement de la clé pour ${provider}:`, error);
        throw error;
      }

      if (apiKeyValue) {
        console.log(`✅ Clé API trouvée pour ${provider}`);
        setApiKey(apiKeyValue);
        setKeyStatus('valid');
        await discoverModels(provider);
      } else {
        console.log(`ℹ️ Aucune clé API trouvée pour ${provider}`);
        setApiKey('');
        setKeyStatus('idle');
        setAvailableModels([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la clé API:', error);
      setKeyStatus('idle');
    }
  };

  const testApiKey = async () => {
    if (!apiKey || !currentProvider) return;

    setIsTestingKey(true);
    try {
      const isValid = await modelDiscoveryService.testApiKey(
        currentProvider as 'openai' | 'anthropic' | 'google',
        apiKey
      );

      if (isValid) {
        setKeyStatus('valid');
        await saveApiKey();
        await discoverModels(currentProvider as 'openai' | 'anthropic' | 'google');
        toast.success(`Clé API ${currentProvider} validée avec succès !`);
      } else {
        setKeyStatus('invalid');
        toast.error('Clé API invalide');
      }
    } catch (error) {
      setKeyStatus('invalid');
      toast.error('Erreur lors de la validation de la clé API');
    } finally {
      setIsTestingKey(false);
    }
  };

  const saveApiKey = async () => {
    console.log(`💾 Sauvegarde de la clé API pour ${currentProvider}...`);
    
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        console.error('❌ Aucun utilisateur connecté');
        return;
      }

      console.log(`🔐 Utilisation de store_encrypted_api_key pour ${currentProvider}`);

      // Utiliser la fonction RPC pour chiffrer et sauvegarder la clé
      const { data, error } = await supabase
        .rpc('store_encrypted_api_key', {
          service_name: currentProvider,
          api_key_value: apiKey
        });

      if (error) {
        console.error('❌ Erreur lors du stockage chiffré:', error);
        throw error;
      }

      console.log(`✅ Clé API chiffrée et sauvegardée avec succès pour ${currentProvider}`);
      setSavedKeys(prev => ({ ...prev, [currentProvider]: true }));
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde de la clé API:', error);
      throw error;
    }
  };

  const discoverModels = async (provider: 'openai' | 'anthropic' | 'google') => {
    console.log(`🔍 Lancement de la découverte des modèles pour ${provider}...`);
    setIsLoadingModels(true);
    
    try {
      const result = await modelDiscoveryService.discoverAvailableModels(provider);
      console.log(`📊 Résultat de la découverte pour ${provider}:`, result);
      
      if (result.error) {
        console.error(`❌ Erreur dans le résultat pour ${provider}:`, result.error);
        toast.error(`Erreur: ${result.error}`);
        setAvailableModels([]);
      } else {
        console.log(`✅ ${result.models.length} modèles trouvés pour ${provider}`);
        setAvailableModels(result.models);
        
        if (result.models.length > 0 && !currentModel) {
          // Sélectionner automatiquement le premier modèle recommandé
          const defaultModel = result.models[0];
          console.log(`🎯 Sélection automatique du modèle: ${defaultModel.id}`);
          setCurrentModel(defaultModel.id);
          onModelSelected(provider, defaultModel.id);
        }
      }
    } catch (error) {
      console.error(`❌ Exception lors de la découverte des modèles pour ${provider}:`, error);
      toast.error('Erreur lors de la découverte des modèles');
      setAvailableModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleModelSelect = (modelId: string) => {
    setCurrentModel(modelId);
    onModelSelected(currentProvider, modelId);
  };

  const getProviderConfig = () => {
    return PROVIDERS.find(p => p.id === currentProvider);
  };

  const renderKeyStatus = () => {
    switch (keyStatus) {
      case 'valid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'invalid':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Configuration du modèle IA</CardTitle>
        <CardDescription>
          Configurez votre fournisseur d'IA et sélectionnez un modèle
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sélection du fournisseur */}
        <div className="space-y-2">
          <Label htmlFor="provider">Fournisseur d'IA</Label>
          <Select value={currentProvider} onValueChange={setCurrentProvider}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez un fournisseur" />
            </SelectTrigger>
            <SelectContent>
              {PROVIDERS.map(provider => (
                <SelectItem key={provider.id} value={provider.id}>
                  <div className="flex items-center gap-2">
                    {provider.name}
                    {savedKeys[provider.id] && (
                      <Badge variant="secondary" className="text-xs">Configuré</Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Configuration de la clé API */}
        {currentProvider && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <div className="space-y-2">
              <Label htmlFor="api-key">
                Clé API {getProviderConfig()?.name}
              </Label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    id="api-key"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={getProviderConfig()?.keyExample}
                    className="pr-10"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {renderKeyStatus()}
                  </div>
                </div>
                <Button
                  onClick={testApiKey}
                  disabled={!apiKey || isTestingKey}
                  variant="outline"
                >
                  {isTestingKey ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Tester'
                  )}
                </Button>
              </div>
            </div>

            {keyStatus === 'invalid' && (
              <Alert variant="destructive">
                <AlertDescription>
                  Clé API invalide. Vérifiez votre clé et réessayez.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Sélection du modèle */}
        {keyStatus === 'valid' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Modèles disponibles</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => discoverModels(currentProvider as 'openai' | 'anthropic' | 'google')}
                disabled={isLoadingModels}
              >
                {isLoadingModels ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Actualiser
              </Button>
            </div>

            {isLoadingModels ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2">Découverte des modèles...</span>
              </div>
            ) : availableModels.length > 0 ? (
              <div className="grid gap-3">
                {availableModels.map(model => (
                  <Card
                    key={model.id}
                    className={`cursor-pointer transition-colors ${
                      currentModel === model.id
                        ? 'ring-2 ring-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleModelSelect(model.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-medium">{model.name}</h4>
                          {model.description && (
                            <p className="text-sm text-muted-foreground">
                              {model.description}
                            </p>
                          )}
                          <div className="flex gap-2 flex-wrap">
                            {model.contextWindow && (
                              <Badge variant="outline" className="text-xs">
                                {model.contextWindow.toLocaleString()} tokens
                              </Badge>
                            )}
                            {model.supportsVision && (
                              <Badge variant="outline" className="text-xs">
                                Vision
                              </Badge>
                            )}
                          </div>
                        </div>
                        {currentModel === model.id && (
                          <CheckCircle className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Alert>
                <AlertDescription>
                  Aucun modèle disponible trouvé pour votre abonnement.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LLMProviderSetup;
