
export interface Sheet {
  id: string;
  name: string;
  url: string;
  lastModified: string;
  clientId?: string;
  clientContext?: string;
}

export interface Client {
  id: string;
  name: string;
  businessContext?: string;
  specifics?: string;
  editorialGuidelines?: string;
}

export interface Campaign {
  name: string;
  adGroups: AdGroup[];
  context: string;
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
