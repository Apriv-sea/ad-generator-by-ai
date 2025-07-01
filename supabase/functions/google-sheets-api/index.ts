
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
  redirectUri?: string;
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
    const clientId = Deno.env.get('GOOGLE_SHEETS_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_SHEETS_CLIENT_SECRET');
    
    console.log('🔑 Diagnostic des variables d\'environnement:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      clientIdPrefix: clientId ? clientId.substring(0, 20) + '...' : 'MANQUANT',
      clientSecretPrefix: clientSecret ? clientSecret.substring(0, 20) + '...' : 'MANQUANT'
    });

    if (!clientId || !clientSecret) {
      throw new Error('Configuration manquante: Variables Google Sheets non définies');
    }

    let requestBody;
    try {
      const bodyText = await req.text();
      console.log('📨 Corps de la requête (brut):', bodyText);
      requestBody = JSON.parse(bodyText);
      console.log('📨 Corps de la requête (parsé):', requestBody);
    } catch (error) {
      console.error('❌ Impossible de parser le JSON:', error);
      throw new Error('Corps de requête JSON invalide: ' + error.message);
    }

    const { action, sheetId, data, range, title, code, redirectUri }: GoogleSheetsRequest = requestBody;

    console.log(`🎯 Action Google Sheets: ${action}`);

    switch (action) {
      case 'auth':
        return await handleAuth(clientId, clientSecret, code, redirectUri);
      
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
    console.error('❌ Erreur Google Sheets API:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    });
    
    const errorResponse = {
      error: error.message || 'Erreur inconnue',
      details: error.stack || 'Pas de détails disponibles',
      timestamp: new Date().toISOString(),
      action: 'Vérifiez la configuration des secrets Google Sheets dans Supabase'
    };

    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: error.message.includes('Configuration') ? 500 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function handleAuth(clientId: string, clientSecret: string, code?: string, redirectUri?: string) {
  console.log('🔐 Gestion de l\'authentification:', { 
    hasCode: !!code,
    hasRedirectUri: !!redirectUri,
    clientIdLength: clientId.length,
    clientSecretLength: clientSecret.length
  });

  // CORRECTION CRITIQUE : Utiliser l'URI fournie par le client ou détecter automatiquement
  if (!redirectUri) {
    console.error('❌ URI de redirection manquante dans la requête');
    throw new Error('URI de redirection requise. Veuillez fournir redirectUri dans la requête.');
  }

  console.log('🌐 URI de redirection utilisée:', redirectUri);

  if (!code) {
    console.log('🌐 Génération de l\'URL d\'authentification avec URI:', redirectUri);
    
    // Générer un paramètre state pour la sécurité
    const state = crypto.randomUUID();
    console.log('🔐 State généré pour la sécurité:', state);
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent('https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file')}&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${encodeURIComponent(state)}`;
    
    console.log('✅ URL d\'authentification générée avec succès');
    
    return new Response(
      JSON.stringify({ authUrl, state }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Échange du code d'autorisation
  console.log('🔄 Échange du code d\'autorisation...', {
    codeLength: code.length,
    redirectUri: redirectUri
  });
  
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

    console.log('📡 Réponse OAuth Google:', {
      status: tokenResponse.status,
      statusText: tokenResponse.statusText,
      headers: Object.fromEntries(tokenResponse.headers.entries())
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      console.error('❌ Erreur lors de l\'échange du token:', {
        status: tokenResponse.status,
        error: tokenData.error,
        error_description: tokenData.error_description,
        fullResponse: tokenData
      });
      
      throw new Error(`Erreur OAuth Google (${tokenResponse.status}): ${tokenData.error_description || tokenData.error || 'Erreur inconnue'}`);
    }

    console.log('✅ Token échangé avec succès:', {
      hasAccessToken: !!tokenData.access_token,
      hasRefreshToken: !!tokenData.refresh_token,
      tokenType: tokenData.token_type,
      expiresIn: tokenData.expires_in
    });

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
  console.log('🔐 === EXTRACTION TOKEN ===');
  console.log('Headers de la requête:', Object.fromEntries(request.headers.entries()));
  
  const authHeader = request.headers.get('Authorization');
  console.log('Header Authorization brut:', authHeader);
  
  if (!authHeader) {
    console.error('❌ Aucun header Authorization trouvé');
    throw new Error('Token d\'accès manquant dans les headers - Header Authorization requis');
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    console.error('❌ Format d\'Authorization invalide:', authHeader.substring(0, 50) + '...');
    throw new Error('Token d\'accès invalide - Format Bearer requis');
  }
  
  const token = authHeader.replace('Bearer ', '');
  console.log('✅ Token extrait:', {
    tokenPrefix: token.substring(0, 20) + '...',
    tokenLength: token.length
  });
  
  return token;
}

async function handleRead(sheetId: string, range: string, request: Request) {
  let accessToken;
  try {
    accessToken = await getAccessToken(request);
  } catch (error) {
    console.error('❌ Erreur extraction token:', error.message);
    throw error;
  }
  
  console.log(`📖 === DEBUT LECTURE AMELIOREE ===`);
  console.log(`📋 Feuille: ${sheetId}`);
  console.log(`📊 Range demandé: ${range}`);
  
  // Validation de l'ID de la feuille
  if (!sheetId || sheetId.length < 10 || !/^[a-zA-Z0-9-_]+$/.test(sheetId)) {
    throw new Error('ID de feuille Google Sheets invalide');
  }
  
  // Essayer plusieurs plages pour maximiser la récupération de données
  const rangeAttempts = [
    range, // Plage demandée
    'A1:Z1000', // Plage large par défaut
    'Sheet1!A1:Z1000', // Avec nom de feuille
    'A:AZ', // Toutes les lignes, colonnes A à AZ
    '1:1000' // Toutes les colonnes, 1000 premières lignes
  ];
  
  let lastError = null;
  
  for (const currentRange of rangeAttempts) {
    try {
      console.log(`📊 Tentative de lecture avec la plage: ${currentRange}`);
      
      const googleApiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(currentRange)}`;
      console.log(`🌐 URL Google API: ${googleApiUrl}`);
      
      const response = await fetch(googleApiUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`📡 Réponse Google API pour ${currentRange}:`, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      // Vérifier le Content-Type de la réponse
      const contentType = response.headers.get('content-type');
      
      if (!response.ok) {
        const responseText = await response.text();
        console.error(`❌ Erreur HTTP ${response.status} pour ${currentRange}:`, responseText);
        
        if (response.status === 403) {
          lastError = new Error('Accès refusé à la feuille Google Sheets. Vérifiez les permissions de partage.');
          continue; // Essayer la plage suivante
        } else if (response.status === 404) {
          lastError = new Error('Feuille ou plage introuvable. Vérifiez l\'ID de la feuille.');
          continue; // Essayer la plage suivante
        } else if (response.status === 400) {
          lastError = new Error(`Plage invalide: ${currentRange}`);
          continue; // Essayer la plage suivante
        } else if (response.status === 401) {
          console.error('🔐 Erreur 401 - Token invalide ou expiré');
          lastError = new Error('Token d\'authentification invalide ou expiré. Reconnectez-vous.');
          continue;
        }
        
        throw new Error(`Erreur API Google Sheets (${response.status}): ${response.statusText}`);
      }
      
      if (!contentType?.includes('application/json')) {
        console.error(`❌ Réponse non-JSON pour ${currentRange}:`, contentType);
        lastError = new Error('Réponse non-JSON reçue du serveur');
        continue;
      }

      const data = await response.json();
      
      console.log(`✅ Données récupérées avec ${currentRange}:`, {
        hasValues: !!data.values,
        valuesType: typeof data.values,
        valuesIsArray: Array.isArray(data.values),
        totalRows: data.values?.length || 0,
        range: data.range,
        majorDimension: data.majorDimension
      });

      // Vérifier si on a des données valides
      if (data.values && Array.isArray(data.values) && data.values.length > 0) {
        console.log(`📋 Succès avec ${currentRange} - ${data.values.length} lignes trouvées`);
        
        // Log détaillé des données
        data.values.forEach((row, index) => {
          const rowData = Array.isArray(row) ? row : [];
          console.log(`  Ligne ${index + 1}: [${rowData.length} colonnes]`, rowData.slice(0, 5));
        });

        // Ne pas filtrer les lignes vides ici - laisser le frontend décider
        const processedData = data.values.map(row => 
          Array.isArray(row) ? row : []
        );

        console.log(`✅ === LECTURE REUSSIE ===`);
        console.log(`📊 Données finales: ${processedData.length} lignes`);

        return new Response(
          JSON.stringify({
            values: processedData,
            range: data.range || currentRange,
            majorDimension: data.majorDimension || 'ROWS',
            title: `Feuille Google Sheets - ${processedData.length} lignes`,
            rangeUsed: currentRange
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        console.log(`⚠️ Pas de données avec ${currentRange}:`, data);
        lastError = new Error(`Aucune donnée trouvée avec la plage ${currentRange}`);
        continue;
      }
      
    } catch (error) {
      console.error(`❌ Erreur avec la plage ${currentRange}:`, error);
      lastError = error;
      continue;
    }
  }
  
  // Si toutes les tentatives ont échoué
  console.error('❌ === ECHEC COMPLET DE LECTURE ===');
  console.error('Toutes les plages ont échoué:', rangeAttempts);
  console.error('Dernière erreur:', lastError);
  
  throw lastError || new Error('Impossible de lire les données de la feuille avec toutes les plages tentées');
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
