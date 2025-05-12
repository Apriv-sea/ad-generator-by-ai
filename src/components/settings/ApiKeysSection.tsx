
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ApiKeyForm from "./ApiKeyForm";

interface ApiKeysSectionProps {
  openaiKey: string;
  anthropicKey: string;
  googleKey: string;
}

const ApiKeysSection: React.FC<ApiKeysSectionProps> = ({
  openaiKey,
  anthropicKey,
  googleKey
}) => {
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
              initialValue={openaiKey}
              placeholder="sk-..."
              helpText="Commençant par 'sk-'. Trouvez votre clé sur"
              helpLink="https://platform.openai.com/account/api-keys"
            />
          </TabsContent>
          
          <TabsContent value="anthropic">
            <ApiKeyForm
              service="anthropic"
              initialValue={anthropicKey}
              placeholder="sk_ant-..."
              helpText="Commençant par 'sk_ant-'. Trouvez votre clé sur"
              helpLink="https://console.anthropic.com/settings/keys"
            />
          </TabsContent>
          
          <TabsContent value="google">
            <ApiKeyForm
              service="google"
              initialValue={googleKey}
              placeholder="AI..."
              helpText="Trouvez votre clé sur"
              helpLink="https://aistudio.google.com/app/apikey"
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ApiKeysSection;
