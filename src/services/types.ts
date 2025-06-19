
export interface Sheet {
  id: string;
  name: string;
  url?: string;
  lastModified: string;
  clientId?: string;
  clientContext?: string;
}

export type { Client } from './types/client';

export interface Campaign {
  id: string;
  sheetId: string;
  name?: string;
  campaignName: string;
  adGroupName: string;
  keywords: string;
  titles: string[];
  descriptions: string[];
  finalUrls: string[];
  displayPaths: string[];
  targetedKeywords: string;
  negativeKeywords: string;
  targetedAudiences: string;
  adExtensions: string;
  lastModified: string;
  clientInfo?: Client | null;
  adGroups?: AdGroup[];
  context?: string;
}

export interface AdGroup {
  name: string;
  keywords: string[];
  context: string;
}

export interface GenerationPrompt {
  clientContext: string;
  campaignContext: string;
  adGroupContext: string;
  keywords: string[];
  model: string;
}
