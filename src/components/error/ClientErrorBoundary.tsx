// Error Boundary spécialisé pour les Clients
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, RefreshCw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedStore } from '@/stores/useUnifiedStore';

interface ClientErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const ClientErrorFallback: React.FC<ClientErrorFallbackProps> = ({ 
  error, 
  resetErrorBoundary 
}) => {
  const navigate = useNavigate();
  const clearAllErrors = useUnifiedStore(state => state.clearAllErrors);

  const handleReset = () => {
    clearAllErrors();
    resetErrorBoundary();
  };

  const handleGoHome = () => {
    clearAllErrors();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <CardTitle className="text-xl">Erreur dans les Clients</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Une erreur s'est produite lors du chargement ou de la gestion des clients. 
            Vos données sont sécurisées.
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
            <Button 
              onClick={handleGoHome} 
              className="flex-1"
            >
              <Home className="w-4 h-4 mr-2" />
              Accueil
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface ClientErrorBoundaryProps {
  children: React.ReactNode;
}

export const ClientErrorBoundary: React.FC<ClientErrorBoundaryProps> = ({ 
  children 
}) => {
  return (
    <ErrorBoundary
      FallbackComponent={ClientErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Client Error:', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
};