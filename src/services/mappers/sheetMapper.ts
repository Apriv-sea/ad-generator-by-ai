
import { Sheet } from "../types";
import { SheetData } from "../types/sheetData";
import { mapClientRecordToClient } from "./clientMapper";
import { ClientRecord } from "@/types/supabase-extensions";

/**
 * Maps database sheet record to Sheet object
 * Note: This is for future Supabase integration, currently sheets are stored in localStorage
 */
export function mapSheetRecordToSheet(record: any): Sheet {
  return {
    id: record.id,
    name: record.name,
    url: record.url || `#/campaigns/editor/${record.id}`,
    lastModified: record.last_modified || record.updated_at || new Date().toISOString(),
    clientId: record.client_id || undefined,
    clientContext: record.client_context || undefined
  };
}

/**
 * Maps Sheet object to database record format
 */
export function mapSheetToSheetRecord(sheet: Partial<Sheet>): any {
  const result: any = {
    name: sheet.name,
  };
  
  if (sheet.id !== undefined) result.id = sheet.id;
  if (sheet.url !== undefined) result.url = sheet.url;
  if (sheet.lastModified !== undefined) result.last_modified = sheet.lastModified;
  if (sheet.clientId !== undefined) result.client_id = sheet.clientId;
  if (sheet.clientContext !== undefined) result.client_context = sheet.clientContext;
  
  return result;
}

/**
 * Maps SheetData for localStorage or future database storage
 */
export function mapSheetDataRecordToSheetData(record: any): SheetData {
  const clientInfo = record.client_info ? 
    (record.client_info as ClientRecord ? mapClientRecordToClient(record.client_info as ClientRecord) : undefined) 
    : undefined;

  return {
    id: record.id,
    content: record.content || [],
    headers: record.headers || [],
    clientInfo: clientInfo,
    lastModified: record.last_modified || record.updated_at || new Date().toISOString()
  };
}

/**
 * Maps SheetData to storage format
 */
export function mapSheetDataToSheetDataRecord(sheetData: Partial<SheetData>): any {
  const result: any = {};
  
  if (sheetData.id !== undefined) result.id = sheetData.id;
  if (sheetData.content !== undefined) result.content = sheetData.content;
  if (sheetData.headers !== undefined) result.headers = sheetData.headers;
  if (sheetData.clientInfo !== undefined) result.client_info = sheetData.clientInfo;
  if (sheetData.lastModified !== undefined) result.last_modified = sheetData.lastModified;
  
  return result;
}
