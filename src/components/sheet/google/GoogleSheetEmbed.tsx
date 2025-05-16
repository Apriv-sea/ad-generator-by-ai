
import React from 'react';

interface GoogleSheetEmbedProps {
  sheetUrl: string;
}

const GoogleSheetEmbed: React.FC<GoogleSheetEmbedProps> = ({ sheetUrl }) => {
  return (
    <div className="border rounded-md overflow-hidden" style={{ height: '700px' }}>
      <iframe
        src={sheetUrl}
        title="Google Sheets Embed"
        width="100%"
        height="100%"
        style={{ border: 'none' }}
      />
    </div>
  );
};

export default GoogleSheetEmbed;
