
import React from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ApiKeysSection from "@/components/settings/ApiKeysSection";

const Settings = () => {
  return (
    <>
      <Navigation />
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Paramètres</h1>
          <p className="text-gray-600">
            Configurez vos préférences et clés API
          </p>
        </div>
        
        <div className="space-y-6">
          <ApiKeysSection />
          
          <Card>
            <CardHeader>
              <CardTitle>Configuration CryptPad</CardTitle>
              <CardDescription>
                Paramètres pour l'intégration avec CryptPad
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                CryptPad offre un chiffrement de bout en bout pour protéger vos données.
                Aucune configuration supplémentaire n'est requise.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Settings;
