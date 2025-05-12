
// Settings.tsx with corrected imports and proper type assertions
import React, { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import GoogleOAuthSection from "@/components/settings/GoogleOAuthSection";
import ApiKeysSection from "@/components/settings/ApiKeysSection";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserId } from "@/services/utils/supabaseUtils";
import { ApiKey } from "@/types/supabase-extensions";

const Settings = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  // Load API keys when page loads
  useEffect(() => {
    if (!isAuthenticated) return;
    loadApiKeys();
  }, [isAuthenticated]);

  // Load API keys from the database
  const loadApiKeys = async () => {
    setIsLoadingKeys(true);
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        setIsLoadingKeys(false);
        return;
      }

      const { data, error } = await supabase
        .from('api_keys' as any)
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error("Erreur lors du chargement des clés API:", error);
      } else if (data) {
        // Map the API keys to our expected format
        const formattedKeys = data.map((key: any) => ({
          id: key.id,
          user_id: key.user_id,
          service: key.service,
          api_key: key.api_key,
          created_at: key.created_at
        }));
        setApiKeys(formattedKeys);
      }
    } catch (error) {
      console.error("Exception lors du chargement des clés API:", error);
    } finally {
      setIsLoadingKeys(false);
    }
  };
  
  if (!isAuthenticated) {
    return null; // Don't show anything while redirecting
  }

  return (
    <>
      <Navigation />
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Paramètres</h1>
        
        <div className="space-y-8">
          <Card className="p-6">
            <GoogleOAuthSection />
          </Card>
          
          <ApiKeysSection
            apiKeys={apiKeys}
            isLoading={isLoadingKeys}
            onApiKeySaved={loadApiKeys}
          />
        </div>
      </div>
    </>
  );
};

export default Settings;
