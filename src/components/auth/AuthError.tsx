
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AuthErrorProps {
  error: string;
}

const AuthError: React.FC<AuthErrorProps> = ({ error }) => {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
};

export default AuthError;
