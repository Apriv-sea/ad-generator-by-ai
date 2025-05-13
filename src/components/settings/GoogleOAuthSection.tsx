
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const GoogleOAuthSection: React.FC = () => {
  const { user } = useAuth();
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [googleUserData, setGoogleUserData] = useState<any>(null);

  // Load connection status from localStorage on component mount
  useEffect(() => {
    const googleConnected = localStorage.getItem("google_connected");
    const googleUser = localStorage.getItem("google_user");
    
    // Check if the user is connected with Google
    if (googleConnected === "true" && user?.app_metadata?.provider === "google") {
      setIsGoogleConnected(true);
      
      // Load Google user data if available
      if (googleUser) {
        try {
          const parsedData = JSON.parse(googleUser);
          setGoogleUserData(parsedData);
        } catch (error) {
          console.error("Error parsing Google user data:", error);
        }
      }
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // Clear Google-related preferences
      localStorage.removeItem("google_connected");
      localStorage.removeItem("google_user");
      setIsGoogleConnected(false);
      setGoogleUserData(null);
      toast.success("Déconnecté avec succès");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      toast.error("Erreur lors de la déconnexion");
    }
  };

  const isGoogleUser = user?.app_metadata?.provider === "google";

  return (
    <div className="max-w-2xl mx-auto">
      <CardHeader className="px-0 pt-0">
        <CardTitle>Connexion Google</CardTitle>
        <CardDescription>
          Gérez votre compte Google connecté
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                {isGoogleUser ? "Compte Google connecté" : "Compte Google"}
              </p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Se déconnecter
            </Button>
          </div>
          
          {isGoogleUser && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Connecté uniquement pour l'authentification. Les données de l'application sont stockées localement.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </div>
  );
};

export default GoogleOAuthSection;
