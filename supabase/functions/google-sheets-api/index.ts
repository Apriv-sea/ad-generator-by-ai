import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GoogleSheetsRequest {
  action: 'auth' | 'read' | 'write' | 'create';
  sheetId?: string;
  data?: any[][];
  range?: string;
  title?: string;
  code?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, sheetId, data, range, title, code }: GoogleSheetsRequest = await req.json();
    
    const clientId = Deno.env.get('GOOGLE_SHEETS_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_SHEETS_CLIENT_SECRET');
    
    if (!clientId || !clientSecret) {
      throw new Error('Configuration Google Sheets manquante');
    }

    console.log(`Action Google Sheets: ${action}`);

    switch (action) {
      case 'auth':
        return await handleAuth(clientId, clientSecret, code);
      
      case 'read':
        if (!sheetId) throw new Error('sheetId requis pour la lecture');
        return await handleRead(sheetId, range || 'A:Z', req);
      
      case 'write':
        if (!sheetId || !data) throw new Error('sheetId et data requis pour l\'écriture');
        return await handleWrite(sheetId, data, range || 'A1', req);
      
      case 'create':
        if (!title) throw new Error('title requis pour la création');
        return await handleCreate(title, req);
      
      default:
        throw new Error('Action non supportée');
    }

  } catch (error) {
    console.error('Erreur Google Sheets API:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function handleAuth(clientId: string, clientSecret: string, code?: string) {
  if (!code) {
    const redirectUri = 'https://ad-generator-by-ai.lovable.app/auth/callback/google';
    
    console.log('Utilisation de l\'URI de redirection:', redirectUri);
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent('https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file')}&` +
      `access_type=offline&` +
      `prompt=consent`;
    
    return new Response(
      JSON.stringify({ authUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const redirectUri = 'https://ad-generator-by-ai.lovable.app/auth/callback/google';
  
  console.log('Échange du code avec URI:', redirectUri);
  
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    })
  });

  const tokenData = await tokenResponse.json();
  
  if (!tokenResponse.ok) {
    console.error('Erreur lors de l\'échange du token:', tokenData);
    throw new Error(`Erreur d'authentification: ${tokenData.error_description || tokenData.error}`);
  }

  return new Response(
    JSON.stringify(tokenData),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getAccessToken(request: Request): Promise<string> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token d\'accès manquant dans les headers');
  }
  
  return authHeader.replace('Bearer ', '');
}

async function handleRead(sheetId: string, range: string, request: Request) {
  const accessToken = await getAccessToken(request);
  
  console.log(`📖 Lecture de la feuille ${sheetId} avec la plage ${range}`);
  
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const data = await response.json();
  
  if (!response.ok) {
    console.error('Erreur API Google Sheets:', data);
    throw new Error(`Erreur lecture: ${data.error?.message || 'Erreur inconnue'}`);
  }

  console.log('📊 Réponse brute Google Sheets API:', {
    hasValues: !!data.values,
    valueCount: data.values?.length || 0,
    range: data.range,
    majorDimension: data.majorDimension,
    rawValues: data.values
  });

  // Si pas de données du tout
  if (!data.values || data.values.length === 0) {
    console.log('⚠️ Aucune donnée trouvée dans la plage spécifiée');
    return new Response(
      JSON.stringify({
        values: [],
        range: data.range,
        majorDimension: data.majorDimension
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Améliorer le filtrage des lignes vides - être plus permissif
  const filteredValues = data.values.filter((row: any[], index: number) => {
    // Toujours garder la première ligne (en-têtes)
    if (index === 0) return true;
    
    // Pour les autres lignes, vérifier qu'il y a au moins une cellule non vide
    if (!row || row.length === 0) return false;
    
    // Vérifier s'il y a au moins une cellule avec du contenu
    const hasContent = row.some(cell => {
      if (cell === null || cell === undefined) return false;
      const cellStr = String(cell).trim();
      return cellStr !== '' && cellStr !== '0'; // Ne pas exclure les cellules avec '0'
    });
    
    console.log(`Ligne ${index}: [${row.join(', ')}] -> ${hasContent ? 'GARDÉE' : 'SUPPRIMÉE'}`);
    return hasContent;
  });

  console.log(`✅ Résultat final: ${filteredValues.length} lignes (${filteredValues.length - 1} lignes de données + 1 ligne d'en-têtes)`);
  console.log('📋 Données filtrées:', filteredValues);

  return new Response(
    JSON.stringify({
      values: filteredValues,
      range: data.range,
      majorDimension: data.majorDimension,
      title: `Feuille Google Sheets - ${Math.max(0, filteredValues.length - 1)} lignes de données`
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleWrite(sheetId: string, data: any[][], range: string, request: Request) {
  const accessToken = await getAccessToken(request);
  
  console.log(`✍️ Écriture dans la feuille ${sheetId}, plage ${range}`);
  
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: data
      })
    }
  );

  const result = await response.json();
  
  if (!response.ok) {
    console.error('Erreur écriture Google Sheets:', result);
    throw new Error(`Erreur écriture: ${result.error?.message || 'Erreur inconnue'}`);
  }

  console.log('✅ Données écrites avec succès');

  return new Response(
    JSON.stringify(result),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleCreate(title: string, request: Request) {
  const accessToken = await getAccessToken(request);
  
  console.log(`📝 Création d'une nouvelle feuille: ${title}`);
  
  const response = await fetch(
    'https://sheets.googleapis.com/v4/spreadsheets',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          title: title
        }
      })
    }
  );

  const result = await response.json();
  
  if (!response.ok) {
    console.error('Erreur création Google Sheets:', result);
    throw new Error(`Erreur création: ${result.error?.message || 'Erreur inconnue'}`);
  }

  console.log('✅ Feuille créée avec succès');

  return new Response(
    JSON.stringify({
      spreadsheetId: result.spreadsheetId,
      spreadsheetUrl: result.spreadsheetUrl
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
