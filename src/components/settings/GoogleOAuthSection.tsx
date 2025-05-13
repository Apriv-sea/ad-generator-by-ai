
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const AccountSection: React.FC = () => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  // Load connection status from localStorage on component mount
  useEffect(() => {
    const authConnected = localStorage.getItem("auth_connected");
    const userDataStr = localStorage.getItem("user_data");
    
    // Check if the user is connected
    if (authConnected === "true" && user) {
      setIsConnected(true);
      
      // Load user data if available
      if (userDataStr) {
        try {
          const parsedData = JSON.parse(userDataStr);
          setUserData(parsedData);
        } catch (error) {
          console.error("Error parsing user data:", error);
        }
      }
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // Clear auth-related preferences
      localStorage.removeItem("auth_connected");
      localStorage.removeItem("user_data");
      setIsConnected(false);
      setUserData(null);
      toast.success("Déconnecté avec succès");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      toast.error("Erreur lors de la déconnexion");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <CardHeader className="px-0 pt-0">
        <CardTitle>Compte utilisateur</CardTitle>
        <CardDescription>
          Gérez votre compte connecté
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                {user ? "Compte connecté" : "Compte"}
              </p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Se déconnecter
            </Button>
          </div>
          
          {user && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Connecté. Les données de l'application sont stockées localement.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </div>
  );
};

export default AccountSection;
