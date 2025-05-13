
import React from "react";
import { Card } from "@/components/ui/card";

const AuthLoading: React.FC = () => {
  return (
    <Card className="p-8 flex flex-col items-center justify-center">
      <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-muted-foreground text-center">
        Traitement de l'authentification...
      </p>
    </Card>
  );
};

export default AuthLoading;
