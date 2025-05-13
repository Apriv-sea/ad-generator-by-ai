
import { Client } from "./client";

// Type for spreadsheet data
export interface SheetData {
  id: string;
  content: any[][];
  headers: string[];
  clientInfo?: Client;
  lastModified: string;
}
