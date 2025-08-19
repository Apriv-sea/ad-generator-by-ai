import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Play, CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { googleSheetsCoreService } from '@/services/core/googleSheetsCore';
import { useGoogleSheets } from '@/contexts/GoogleSheetsContext';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
  details?: any;
}

const GoogleSheetsDebugger: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { isAuthenticated, error } = useGoogleSheets();

  const addTest = (test: TestResult) => {
    setTests(prev => [...prev, test]);
  };

  const clearTests = () => {
    setTests([]);
  };

  const runDiagnostic = async () => {
    setIsRunning(true);
    clearTests();

    // Test 1: Configuration de l'environnement
    addTest({
      name: 'Configuration Environnement',
      status: 'success',
      message: `Origin: ${window.location.origin}`,
      details: {
        hostname: window.location.hostname,
        protocol: window.location.protocol,
        port: window.location.port
      }
    });

    // Test 2: URL de l'API
    const apiUrl = (googleSheetsCoreService as any).getApiBaseUrl();
    addTest({
      name: 'URL Edge Function',
      status: 'success',
      message: `API URL: ${apiUrl}`,
      details: { url: apiUrl }
    });

    // Test 3: Test de connectivité Edge Function
    try {
      console.log('🧪 Test connectivité Edge Function...');
      const testResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'auth',
          redirectUri: `${window.location.origin}/auth/google`
        })
      });

      const responseText = await testResponse.text();
      
      if (testResponse.ok) {
        addTest({
          name: 'Connectivité Edge Function',
          status: 'success',
          message: 'Edge function accessible et répond correctement',
          details: { 
            status: testResponse.status,
            response: responseText.substring(0, 200)
          }
        });
      } else {
        addTest({
          name: 'Connectivité Edge Function',
          status: 'error',
          message: `Erreur ${testResponse.status}: ${responseText}`,
          details: { 
            status: testResponse.status,
            response: responseText
          }
        });
      }
    } catch (error) {
      addTest({
        name: 'Connectivité Edge Function',
        status: 'error',
        message: `Erreur réseau: ${error.message}`,
        details: error
      });
    }

    // Test 4: État d'authentification
    addTest({
      name: 'État Authentification',
      status: isAuthenticated ? 'success' : 'warning',
      message: isAuthenticated ? 'Utilisateur authentifié' : 'Pas d\'authentification active',
      details: {
        authenticated: isAuthenticated,
        hasStoredTokens: !!localStorage.getItem('google_sheets_auth')
      }
    });

    // Test 5: Erreurs contexte
    if (error) {
      addTest({
        name: 'Erreurs Contexte',
        status: 'error',
        message: error,
        details: { error }
      });
    } else {
      addTest({
        name: 'Erreurs Contexte',
        status: 'success',
        message: 'Aucune erreur détectée dans le contexte'
      });
    }

    // Test 6: LocalStorage
    try {
      const testKey = 'test_storage';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      addTest({
        name: 'LocalStorage',
        status: 'success',
        message: 'LocalStorage fonctionnel'
      });
    } catch (error) {
      addTest({
        name: 'LocalStorage',
        status: 'error',
        message: `LocalStorage non disponible: ${error.message}`
      });
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return <RefreshCw className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Diagnostic Google Sheets
        </CardTitle>
        <CardDescription>
          Test complet de la connectivité et de la configuration Google Sheets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDiagnostic} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Diagnostic en cours...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Lancer le diagnostic
            </>
          )}
        </Button>

        {tests.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h3 className="text-lg font-medium">Résultats des tests</h3>
              
              {tests.map((test, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(test.status)}
                      <span className="font-medium">{test.name}</span>
                    </div>
                    <Badge className={getStatusColor(test.status)}>
                      {test.status}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {test.message}
                  </p>
                  
                  {test.details && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        Détails techniques
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded overflow-auto">
                        {JSON.stringify(test.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleSheetsDebugger;