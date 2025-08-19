import React from 'react';
import GoogleSheetsDebugger from '@/components/debug/GoogleSheetsDebugger';
import { GoogleSheetsProvider } from '@/contexts/GoogleSheetsContext';

const GoogleSheetsDebugPage: React.FC = () => {
  return (
    <GoogleSheetsProvider>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">
            Diagnostic Google Sheets
          </h1>
          <GoogleSheetsDebugger />
        </div>
      </div>
    </GoogleSheetsProvider>
  );
};

export default GoogleSheetsDebugPage;