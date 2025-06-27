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
        return await handleRead(sheetId, range, supabaseClient);
      
      case 'write':
        if (!sheetId || !data) throw new Error('sheetId et data requis pour l\'écriture');
        return await handleWrite(sheetId, data, range, supabaseClient);
      
      case 'create':
        if (!title) throw new Error('title requis pour la création');
        return await handleCreate(title, supabaseClient);
      
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
    // Utiliser une URL fixe au lieu de la construire dynamiquement
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

  // Échanger le code contre un token d'accès avec la même URI fixe
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

async function getAccessToken(supabaseClient: any): Promise<string> {
  // Récupérer le token depuis le header Authorization
  const authHeader = Deno.env.get('AUTHORIZATION') || '';
  if (!authHeader.startsWith('Bearer ')) {
    throw new Error('Token d\'accès manquant dans les headers');
  }
  
  return authHeader.replace('Bearer ', '');
}

async function handleRead(sheetId: string, range: string = 'A:Z', supabaseClient: any) {
  const accessToken = await getAccessToken(supabaseClient);
  
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
    throw new Error(`Erreur lecture: ${data.error?.message || 'Erreur inconnue'}`);
  }

  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleWrite(sheetId: string, data: any[][], range: string = 'A1', supabaseClient: any) {
  const accessToken = await getAccessToken(supabaseClient);
  
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
    throw new Error(`Erreur écriture: ${result.error?.message || 'Erreur inconnue'}`);
  }

  return new Response(
    JSON.stringify(result),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleCreate(title: string, supabaseClient: any) {
  const accessToken = await getAccessToken(supabaseClient);
  
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
    throw new Error(`Erreur création: ${result.error?.message || 'Erreur inconnue'}`);
  }

  return new Response(
    JSON.stringify(result),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
