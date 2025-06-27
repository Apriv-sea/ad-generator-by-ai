
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
  console.log('🌐 Edge Function appelée:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  if (req.method === 'OPTIONS') {
    console.log('✅ Requête OPTIONS - retour des headers CORS');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Vérifier les variables d'environnement
    const clientId = Deno.env.get('GOOGLE_SHEETS_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_SHEETS_CLIENT_SECRET');
    
    console.log('🔑 Variables d\'environnement:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      clientIdLength: clientId?.length || 0
    });

    if (!clientId || !clientSecret) {
      console.error('❌ Configuration Google Sheets manquante');
      throw new Error('Configuration Google Sheets manquante - vérifiez les secrets Supabase');
    }

    // Parser le body de la requête
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('📨 Corps de la requête:', { action: requestBody.action });
    } catch (error) {
      console.error('❌ Impossible de parser le JSON:', error);
      throw new Error('Corps de requête JSON invalide');
    }

    const { action, sheetId, data, range, title, code }: GoogleSheetsRequest = requestBody;

    console.log(`🎯 Action Google Sheets: ${action}`);

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
        throw new Error(`Action non supportée: ${action}`);
    }

  } catch (error) {
    console.error('❌ Erreur Google Sheets API:', error);
    
    const errorResponse = {
      error: error.message || 'Erreur inconnue',
      details: error.stack || 'Pas de détails disponibles'
    };

    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function handleAuth(clientId: string, clientSecret: string, code?: string) {
  console.log('🔐 Gestion de l\'authentification:', { hasCode: !!code });

  if (!code) {
    // Déterminer l'URL de redirection
    const redirectUri = 'https://ad-generator-by-ai.lovable.app/auth/callback/google';
    
    console.log('🌐 Génération de l\'URL d\'authentification avec URI:', redirectUri);
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent('https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file')}&` +
      `access_type=offline&` +
      `prompt=consent`;
    
    console.log('✅ URL d\'authentification générée');
    
    return new Response(
      JSON.stringify({ authUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Échange du code d'autorisation
  const redirectUri = 'https://ad-generator-by-ai.lovable.app/auth/callback/google';
  
  console.log('🔄 Échange du code d\'autorisation...');
  
  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
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
      console.error('❌ Erreur lors de l\'échange du token:', {
        status: tokenResponse.status,
        error: tokenData.error,
        error_description: tokenData.error_description
      });
      
      throw new Error(`Erreur OAuth: ${tokenData.error_description || tokenData.error || 'Erreur inconnue'}`);
    }

    console.log('✅ Token échangé avec succès');
    return new Response(
      JSON.stringify(tokenData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Erreur lors de l\'échange du token:', error);
    throw new Error(`Impossible d'échanger le code d'autorisation: ${error.message}`);
  }
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
  
  // Validation de l'ID de la feuille
  if (!sheetId || sheetId.length < 10 || !/^[a-zA-Z0-9-_]+$/.test(sheetId)) {
    throw new Error('ID de feuille Google Sheets invalide');
  }
  
  const googleApiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`;
  
  try {
    const response = await fetch(googleApiUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`📡 Réponse Google API Status: ${response.status}`);

    // Vérifier le Content-Type de la réponse
    const contentType = response.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      console.error('❌ Réponse non-JSON détectée:', contentType);
      
      const responseText = await response.text();
      console.log('❌ Contenu de la réponse:', responseText.substring(0, 200));
      
      if (response.status === 403) {
        throw new Error('Accès refusé à la feuille Google Sheets. Vérifiez les permissions.');
      } else if (response.status === 404) {
        throw new Error('Feuille Google Sheets introuvable. Vérifiez l\'ID de la feuille.');
      } else {
        throw new Error(`Erreur API Google Sheets (${response.status}): ${response.statusText}`);
      }
    }

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Erreur API Google Sheets:', data);
      throw new Error(`Erreur lecture: ${data.error?.message || 'Erreur inconnue'}`);
    }

    console.log('✅ Données récupérées avec succès');

    return new Response(
      JSON.stringify({
        values: data.values || [],
        range: data.range,
        majorDimension: data.majorDimension,
        title: `Feuille Google Sheets - ${(data.values?.length || 1) - 1} lignes de données`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Erreur lors de la lecture:', error);
    throw error;
  }
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
    console.error('❌ Erreur écriture Google Sheets:', result);
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
    console.error('❌ Erreur création Google Sheets:', result);
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
