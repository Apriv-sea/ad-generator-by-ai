
import React from "react";

const SheetHelpText: React.FC = () => {
  return (
    <div className="text-xs text-muted-foreground space-y-1">
      <p>• L'URL ressemble à : https://docs.google.com/spreadsheets/d/1ABC...xyz/edit</p>
      <p>• L'ID est la partie entre /d/ et /edit</p>
      <p>• Votre ID: 1uawoG2RorJDRrWtdLHEe9AD7sIoRWmp9h_vAAtr5vVI</p>
    </div>
  );
};

export default SheetHelpText;
