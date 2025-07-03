import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { modelDiscoveryService, ProviderModels } from '@/services/llm/modelDiscoveryService';
import { toast } from "sonner";

interface ModelDebuggerProps {
  onModelSelected?: (provider: string, model: string) => void;
}

const ModelDebugger: React.FC<ModelDebuggerProps> = ({ onModelSelected }) => {
  const [providers] = useState<('openai' | 'anthropic' | 'google')[]>(['openai', 'anthropic', 'google']);
  const [providerResults, setProviderResults] = useState<Map<string, ProviderModels>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('anthropic');
  const [selectedModel, setSelectedModel] = useState<string>('');

  const testAllProviders = async () => {
    setIsLoading(true);
    setProviderResults(new Map());
    
    console.log('🔍 === DÉBUT TEST DÉCOUVERTE MODÈLES ===');
    
    for (const provider of providers) {
      console.log(`\n🎯 Test provider: ${provider}`);
      
      try {
        const result = await modelDiscoveryService.discoverAvailableModels(provider);
        console.log(`📊 Résultat ${provider}:`, result);
        
        setProviderResults(prev => new Map(prev.set(provider, result)));
        
        if (result.error) {
          toast.error(`${provider}: ${result.error}`);
        } else {
          toast.success(`${provider}: ${result.models.length} modèles trouvés`);
        }
        
      } catch (error) {
        console.error(`❌ Erreur ${provider}:`, error);
        const errorResult: ProviderModels = {
          provider,
          models: [],
          error: error.message || `Erreur de connexion ${provider}`
        };
        setProviderResults(prev => new Map(prev.set(provider, errorResult)));
        toast.error(`${provider}: Erreur de connexion`);
      }
    }
    
    console.log('✅ === FIN TEST DÉCOUVERTE MODÈLES ===');
    setIsLoading(false);
  };

  useEffect(() => {
    testAllProviders();
  }, []);

  const handleModelSelect = (provider: string, modelId: string) => {
    setSelectedProvider(provider);
    setSelectedModel(modelId);
    
    if (onModelSelected) {
      onModelSelected(provider, modelId);
    }
    
    toast.success(`Modèle sélectionné: ${provider} - ${modelId}`);
  };

  const getProviderStatus = (provider: string) => {
    const result = providerResults.get(provider);
    
    if (!result) {
      return { icon: Loader, color: 'text-gray-500', bg: 'bg-gray-50', message: 'En attente...' };
    }
    
    if (result.error) {
      return { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', message: result.error };
    }
    
    if (result.models.length === 0) {
      return { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50', message: 'Aucun modèle trouvé' };
    }
    
    return { 
      icon: CheckCircle, 
      color: 'text-green-600', 
      bg: 'bg-green-50', 
      message: `${result.models.length} modèle(s) disponible(s)` 
    };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Diagnostique des modèles LLM</span>
            <Button
              variant="outline"
              size="sm"
              onClick={testAllProviders}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Retester
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Status par provider */}
          {providers.map(provider => {
            const status = getProviderStatus(provider);
            const result = providerResults.get(provider);
            const Icon = status.icon;
            
            return (
              <div key={provider} className={`p-4 rounded-lg border ${status.bg}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Icon className={`h-5 w-5 ${status.color}`} />
                    <div>
                      <h3 className="font-semibold capitalize">{provider}</h3>
                      <p className={`text-sm ${status.color}`}>{status.message}</p>
                    </div>
                  </div>
                  
                  {result && !result.error && (
                    <Badge variant="secondary">
                      {result.models.length} modèles
                    </Badge>
                  )}
                </div>
                
                {/* Liste des modèles si disponibles */}
                {result && !result.error && result.models.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Modèles disponibles:</p>
                    <div className="grid grid-cols-1 gap-2">
                      {result.models.slice(0, 5).map(model => (
                        <Button
                          key={model.id}
                          variant={selectedProvider === provider && selectedModel === model.id ? "default" : "outline"}
                          size="sm"
                          className="justify-start h-auto p-3"
                          onClick={() => handleModelSelect(provider, model.id)}
                        >
                          <div className="text-left">
                            <div className="font-medium">{model.id}</div>
                            {model.description && (
                              <div className="text-xs text-muted-foreground">{model.description}</div>
                            )}
                            {model.contextWindow && (
                              <div className="text-xs text-muted-foreground">
                                Context: {model.contextWindow.toLocaleString()} tokens
                              </div>
                            )}
                          </div>
                        </Button>
                      ))}
                      {result.models.length > 5 && (
                        <p className="text-xs text-muted-foreground">
                          ... et {result.models.length - 5} autres modèles
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Erreur détaillée */}
                {result && result.error && (
                  <Alert className="mt-3 border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <strong>Erreur détaillée:</strong> {result.error}
                      <br/>
                      <span className="text-xs">
                        Vérifiez que votre clé API {provider} est correctement configurée dans les paramètres.
                      </span>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            );
          })}
          
          {/* Modèle sélectionné */}
          {selectedProvider && selectedModel && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Modèle sélectionné:</strong> {selectedProvider} - {selectedModel}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Instructions de dépannage */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Dépannage:</strong>
              <ul className="list-disc list-inside mt-1 text-sm">
                <li>Si aucun modèle n'apparaît, vérifiez vos clés API dans les Paramètres</li>
                <li>Les erreurs 401/403 indiquent un problème de clé API</li>
                <li>Les erreurs de réseau peuvent être temporaires</li>
                <li>Anthropic nécessite une clé API valide avec des crédits</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModelDebugger;