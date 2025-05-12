
import React from "react";

interface DebugUserAgentProps {
  userAgent: string;
}

const DebugUserAgent: React.FC<DebugUserAgentProps> = ({ userAgent }) => {
  return (
    <div>
      <h3 className="font-medium mb-1">User Agent</h3>
      <p className="text-sm">{userAgent}</p>
    </div>
  );
};

export default DebugUserAgent;
