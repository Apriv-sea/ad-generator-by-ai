
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AuthErrorProps {
  error: string;
}

const AuthError: React.FC<AuthErrorProps> = ({ error }) => {
  return (
    <Alert variant="destructive" className="mb-6">
      <AlertDescription className="flex items-center gap-2">
        <span className="i-lucide-alert-circle h-4 w-4"></span>
        {error}
      </AlertDescription>
    </Alert>
  );
};

export default AuthError;
