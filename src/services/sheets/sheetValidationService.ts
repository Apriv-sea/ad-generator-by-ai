
export const extractSheetId = (input: string): string | null => {
  const trimmed = input.trim();
  
  if (!trimmed.includes('docs.google.com') && !trimmed.includes('http')) {
    return trimmed;
  }
  
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
};

export const validateSheetId = (sheetId: string): boolean => {
  return /^[a-zA-Z0-9-_]{40,}$/.test(sheetId);
};
