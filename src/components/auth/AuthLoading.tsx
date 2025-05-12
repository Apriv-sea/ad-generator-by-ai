
import React from "react";
import { Loader } from "lucide-react";

const AuthLoading = () => {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <Loader className="h-8 w-8 animate-spin text-primary mb-4" />
      <p>Traitement de l'authentification...</p>
    </div>
  );
};

export default AuthLoading;
