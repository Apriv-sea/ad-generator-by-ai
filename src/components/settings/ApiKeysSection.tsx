
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ApiKeyForm from "./ApiKeyForm";
import { ApiKey } from "@/types/supabase-extensions";

interface ApiKeysSectionProps {
  apiKeys: ApiKey[];
  isLoading: boolean;
  onApiKeySaved: () => void;
}

const ApiKeysSection: React.FC<ApiKeysSectionProps> = ({
  apiKeys,
  isLoading,
  onApiKeySaved
}) => {
  // Find keys by service
  const getKeyByService = (service: string): ApiKey | undefined => {
    return apiKeys.find(key => key.service === service);
  };

  const openaiKey = getKeyByService('openai');
  const anthropicKey = getKeyByService('anthropic');
  const googleKey = getKeyByService('google');

  return (
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
          
          <TabsContent value="openai">
            <ApiKeyForm
              service="openai"
              apiKey={openaiKey}
              onApiKeySaved={onApiKeySaved}
            />
          </TabsContent>
          
          <TabsContent value="anthropic">
            <ApiKeyForm
              service="anthropic"
              apiKey={anthropicKey}
              onApiKeySaved={onApiKeySaved}
            />
          </TabsContent>
          
          <TabsContent value="google">
            <ApiKeyForm
              service="google"
              apiKey={googleKey}
              onApiKeySaved={onApiKeySaved}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ApiKeysSection;
