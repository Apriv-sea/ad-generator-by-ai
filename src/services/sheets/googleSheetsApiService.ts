
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserId } from "@/services/utils/supabaseUtils";

export const getGoogleApiKey = async (): Promise<string | null> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    const { data, error } = await supabase
      .from('api_keys')
      .select('api_key')
      .eq('user_id', userId)
      .eq('service', 'google')
      .maybeSingle();

    if (error || !data) return null;
    return data.api_key;
  } catch (error) {
    console.error('Erreur lors de la récupération de la clé API:', error);
    return null;
  }
};

export const getSheetData = async (sheetId: string): Promise<any> => {
  const apiKey = await getGoogleApiKey();
  
  if (!apiKey) {
    throw new Error('Clé API Google non configurée. Veuillez ajouter votre clé API Google dans les paramètres.');
  }

  const range = 'Sheet1';
  const baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
  const url = `${baseUrl}/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(range)}?key=${apiKey}`;
  
  console.log('🔗 URL de requête:', url);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  console.log('📡 Statut de la réponse:', response.status);
  console.log('📡 Headers de la réponse:', Object.fromEntries(response.headers));

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errorBody = await response.text();
      console.log('❌ Corps de l\'erreur:', errorBody);
      errorDetail = errorBody;
    } catch (e) {
      errorDetail = 'Impossible de lire le détail de l\'erreur';
    }

    if (response.status === 400) {
      throw new Error(`Requête invalide (400). Détail: ${errorDetail}`);
    } else if (response.status === 403) {
      throw new Error('Feuille non accessible. Assurez-vous qu\'elle est partagée publiquement.');
    } else if (response.status === 404) {
      throw new Error('Feuille introuvable. Vérifiez l\'ID de la feuille.');
    } else {
      throw new Error(`Erreur ${response.status}: ${errorDetail}`);
    }
  }

  const data = await response.json();
  console.log('✅ Données reçues:', data);
  return data;
};

export const getSheetInfo = async (sheetId: string): Promise<any> => {
  const apiKey = await getGoogleApiKey();
  
  if (!apiKey) {
    throw new Error('Clé API Google non configurée.');
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}?key=${apiKey}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Impossible de récupérer les infos: ${response.status}`);
  }
  
  const data = await response.json();
  return {
    title: data.properties?.title || 'Feuille sans titre',
    sheets: data.sheets?.map((sheet: any) => ({
      title: sheet.properties?.title,
      id: sheet.properties?.sheetId
    })) || []
  };
};
