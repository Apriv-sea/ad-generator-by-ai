
import React, { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import ApiKeysSection from "@/components/settings/ApiKeysSection";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserId } from "@/services/utils/supabaseUtils";
import { ApiKey } from "@/types/supabase-extensions";

const Settings = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadApiKeys = async () => {
    setIsLoading(true);
    try {
      const userId = await getCurrentUserId();
      if (!userId) return;

      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      
      setApiKeys(data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des clés API:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApiKeys();
  }, []);

  return (
    <>
      <Navigation />
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Paramètres</h1>
          <p className="text-gray-600">
            Configurez vos clés API et préférences de génération de contenu
          </p>
        </div>
        
        <div className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Sécurité :</strong> Vos clés API sont chiffrées et stockées localement. 
              Elles ne sont jamais transmises à nos serveurs et restent privées.
            </AlertDescription>
          </Alert>

          <ApiKeysSection 
            apiKeys={apiKeys}
            isLoading={isLoading}
            onApiKeySaved={loadApiKeys}
          />
          
          <Card>
            <CardHeader>
              <CardTitle>Confidentialité des Données</CardTitle>
              <CardDescription>
                Informations sur la gestion de vos données
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm"><strong>Traitement local :</strong> Toutes les données sont traitées dans votre navigateur</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm"><strong>Chiffrement :</strong> Les clés API sont chiffrées avant stockage</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm"><strong>Aucun tracking :</strong> Vos données ne sont pas partagées avec des tiers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Settings;
