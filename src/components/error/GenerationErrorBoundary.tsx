// Error Boundary spécialisé pour la Génération de contenu
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wand2, RefreshCw, Settings, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedStore } from '@/stores/useUnifiedStore';

interface GenerationErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const GenerationErrorFallback: React.FC<GenerationErrorFallbackProps> = ({ 
  error, 
  resetErrorBoundary 
}) => {
  const navigate = useNavigate();
  const clearAllErrors = useUnifiedStore(state => state.clearAllErrors);

  const handleReset = () => {
    clearAllErrors();
    resetErrorBoundary();
  };

  const handleGoToSettings = () => {
    clearAllErrors();
    navigate('/settings');
  };

  const isApiKeyError = error.message.includes('API') || error.message.includes('key');

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
            isApiKeyError ? 'bg-orange-100' : 'bg-red-100'
          }`}>
            {isApiKeyError ? (
              <Settings className={`w-6 h-6 ${isApiKeyError ? 'text-orange-600' : 'text-red-600'}`} />
            ) : (
              <AlertTriangle className="w-6 h-6 text-red-600" />
            )}
          </div>
          <CardTitle className="text-xl">
            {isApiKeyError ? 'Configuration requise' : 'Erreur de génération'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            {isApiKeyError 
              ? 'Il semble qu\'il y ait un problème avec vos clés API. Vérifiez votre configuration.'
              : 'Une erreur s\'est produite lors de la génération de contenu. Réessayez ou contactez le support.'
            }
          </p>
          
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground mb-2">
              Détails techniques
            </summary>
            <pre className="bg-muted p-2 rounded text-xs overflow-auto">
              {error.message}
            </pre>
          </details>

          <div className="flex gap-2">
            <Button 
              onClick={handleReset} 
              variant="outline" 
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Réessayer
            </Button>
            {isApiKeyError && (
              <Button 
                onClick={handleGoToSettings} 
                className="flex-1"
              >
                <Settings className="w-4 h-4 mr-2" />
                Configurer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface GenerationErrorBoundaryProps {
  children: React.ReactNode;
}

export const GenerationErrorBoundary: React.FC<GenerationErrorBoundaryProps> = ({ 
  children 
}) => {
  return (
    <ErrorBoundary
      FallbackComponent={GenerationErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Generation Error:', error, errorInfo);
        // Log spécifique pour les erreurs de génération
      }}
    >
      {children}
    </ErrorBoundary>
  );
};