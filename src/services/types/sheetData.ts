
import { Client } from "./client";
import { Campaign } from "../types";

// Type for spreadsheet data
export interface SheetData {
  id: string;
  content: any[][];
  headers: string[];
  clientInfo?: Client;
  lastModified: string;
  
  // Méthode pour extraire les campagnes des données du tableur
  extractCampaigns?: () => Campaign[];
}
