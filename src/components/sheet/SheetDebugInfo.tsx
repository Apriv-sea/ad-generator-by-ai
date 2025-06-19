
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SheetDebugInfoProps {
  debugInfo: string;
}

const SheetDebugInfo: React.FC<SheetDebugInfoProps> = ({ debugInfo }) => {
  if (!debugInfo) return null;

  return (
    <Alert>
      <AlertDescription>
        <strong>Debug:</strong><br/>
        <pre className="text-xs mt-1 whitespace-pre-wrap">{debugInfo}</pre>
      </AlertDescription>
    </Alert>
  );
};

export default SheetDebugInfo;
