
export const extractPadId = (input: string): string | null => {
  const trimmed = input.trim();
  
  if (!trimmed.includes('cryptpad.fr') && !trimmed.includes('http')) {
    return trimmed;
  }
  
  const match = trimmed.match(/cryptpad\.fr\/(?:sheet|calc)\/#\/\d+\/(?:sheet|calc)\/edit\/([^\/]+)/);
  return match ? match[1] : null;
};

export const validatePadId = (padId: string): boolean => {
  return /^[a-zA-Z0-9+\/=]+$/.test(padId) && padId.length > 10;
};
