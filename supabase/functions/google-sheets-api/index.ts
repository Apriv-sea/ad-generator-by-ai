import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface AuthRequest {
  action: 'initiate_auth';
}

interface TokenRequest {
  action: 'exchange_token';
  code: string;
  state: string;
}

interface GoogleSheetsRequest {
  action: 'read_sheet' | 'write_sheet' | 'create_sheet' | 'check_auth' | 'logout';
  sheetId?: string;
  range?: string;
  data?: string[][];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Debug: Log all headers to understand what's being sent
  console.log('🔍 Request headers:', Object.fromEntries(req.headers.entries()));
  
  const authHeader = req.headers.get('Authorization');
  console.log('🔐 Authorization header:', authHeader ? `Bearer ${authHeader.substring(0, 20)}...` : 'MISSING');

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: authHeader! },
      },
    }
  )

  try {
    // Verify JWT token and get user
    console.log('🔐 Attempting to get user from JWT...');
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    console.log('🔐 User verification result:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      error: userError?.message
    });
    
    if (userError || !user) {
      console.log('❌ Authentication failed:', userError?.message || 'No user found')
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Rate limiting check - max 100 requests per user per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('google_sheets_audit_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', oneHourAgo)

    if (count && count > 100) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Max 100 requests per hour.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const clientIP = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'

    // Log the request
    await auditLog(supabase, user.id, body.action, body.sheetId || null, clientIP, userAgent, true)

    if (body.action === 'initiate_auth') {
      return await handleInitiateAuth(supabase, user.id, req)
    } else if (body.action === 'exchange_token') {
      return await handleTokenExchange(supabase, user.id, body.code, body.state, req)
    } else if (body.action === 'check_auth') {
      return await handleCheckAuth(supabase, user.id)
    } else if (body.action === 'logout') {
      return await handleLogout(supabase, user.id)
    } else if (['read_sheet', 'write_sheet', 'create_sheet'].includes(body.action)) {
      return await handleGoogleSheetsOperation(supabase, user.id, body, clientIP, userAgent)
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('Error in Google Sheets API:', error.message)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleInitiateAuth(supabase: any, userId: string, req: Request) {
  // Try multiple environment variable names for Google OAuth
  const clientId = Deno.env.get('GOOGLE_SHEETS_CLIENT_ID') || Deno.env.get('GOOGLE_CLIENT_ID')
  const clientSecret = Deno.env.get('GOOGLE_SHEETS_CLIENT_SECRET') || Deno.env.get('GOOGLE_CLIENT_SECRET')
  
  console.log('🔍 Checking Google Sheets OAuth configuration:', {
    hasClientId: !!clientId,
    hasClientSecret: !!clientSecret,
    clientIdLength: clientId?.length || 0,
    clientSecretLength: clientSecret?.length || 0,
    availableEnvVars: Object.keys(Deno.env.toObject()).filter(key => key.includes('GOOGLE')),
    allEnvVars: Object.keys(Deno.env.toObject())
  })
  
  if (!clientId || !clientSecret) {
    const missing = []
    if (!clientId) missing.push('GOOGLE_SHEETS_CLIENT_ID')
    if (!clientSecret) missing.push('GOOGLE_SHEETS_CLIENT_SECRET')
    
    console.error('❌ Missing Google Sheets OAuth secrets:', missing)
    throw new Error(`Configuration incomplète: ${missing.join(', ')} manquant(s). Veuillez configurer les secrets Google Sheets dans Supabase.`)
  }

  // Generate secure state
  const state = crypto.randomUUID()
  
  // Store state in database with expiry
  const { error } = await supabase
    .from('oauth_states')
    .insert({
      user_id: userId,
      state: state,
    })

  if (error) {
    console.error('Failed to store OAuth state:', error)
    throw new Error('Failed to initialize authentication')
  }

  // Get appropriate redirect URI for production environment
  const getRedirectUri = (): string => {
    return 'https://ad-content-generator.lovable.app/auth/callback/google'
  }

  const origin = req.headers.get('origin')
  const redirectUri = getRedirectUri(origin)

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=https://www.googleapis.com/auth/spreadsheets&` +
    `response_type=code&` +
    `access_type=offline&` +
    `state=${state}&` +
    `prompt=consent`

  return new Response(
    JSON.stringify({ authUrl }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleTokenExchange(supabase: any, userId: string, code: string, state: string, req: Request) {
  console.log('🔍 Validating OAuth state:', { userId, state, codePresent: !!code })
  
  // Check if state parameter is missing or empty
  if (!state || state.trim() === '') {
    console.error('❌ Empty or missing state parameter')
    throw new Error('Missing authentication state parameter - please retry authentication')
  }
  
  // Validate state in database
  const { data: stateData, error: stateError } = await supabase
    .from('oauth_states')
    .select('*')
    .eq('user_id', userId)
    .eq('state', state)
    .single()

  console.log('📊 State validation result:', { stateData, stateError, searchedState: state })

  if (stateError) {
    console.error('❌ Database error during state validation:', stateError)
    
    // Check if it's a "no rows returned" error
    if (stateError.code === 'PGRST116') {
      throw new Error('Authentication state not found - please retry authentication')
    }
    
    throw new Error('Database error during authentication')
  }

  if (!stateData) {
    console.error('❌ State validation failed - state not found')
    throw new Error('Invalid authentication state - please retry')
  }

  // Check if state is expired
  if (stateData.expires_at && new Date() >= new Date(stateData.expires_at)) {
    console.error('❌ State has expired:', { expires_at: stateData.expires_at, now: new Date().toISOString() })
    throw new Error('Authentication session expired - please retry')
  }

  // Clean up used state
  await supabase
    .from('oauth_states')
    .delete()
    .eq('id', stateData.id)

  const clientId = Deno.env.get('GOOGLE_SHEETS_CLIENT_ID') || Deno.env.get('GOOGLE_CLIENT_ID')
  const clientSecret = Deno.env.get('GOOGLE_SHEETS_CLIENT_SECRET') || Deno.env.get('GOOGLE_CLIENT_SECRET')
  
  console.log('🔍 Token exchange - checking secrets:', {
    hasClientId: !!clientId,
    hasClientSecret: !!clientSecret
  })
  
  if (!clientId || !clientSecret) {
    const missing = []
    if (!clientId) missing.push('GOOGLE_SHEETS_CLIENT_ID')
    if (!clientSecret) missing.push('GOOGLE_SHEETS_CLIENT_SECRET')
    
    console.error('❌ Missing Google Sheets OAuth secrets for token exchange:', missing)
    throw new Error(`Configuration incomplète: ${missing.join(', ')} manquant(s)`)
  }

  // Use the same redirect URI logic as in initiate auth - production only
  const getRedirectUri = (): string => {
    return 'https://ad-content-generator.lovable.app/auth/callback/google'
  }

  const origin = req.headers.get('origin')
  const redirectUri = getRedirectUri(origin)

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  })

  if (!tokenResponse.ok) {
    throw new Error('Failed to exchange authorization code for tokens')
  }

  const tokens = await tokenResponse.json()

  // Store tokens securely in database
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()
  
  const { error: tokenError } = await supabase
    .from('google_tokens')
    .upsert({
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
    })

  if (tokenError) {
    console.error('Failed to store Google tokens:', tokenError)
    throw new Error('Failed to store authentication tokens')
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleCheckAuth(supabase: any, userId: string) {
  const { data: tokenData, error } = await supabase
    .from('google_tokens')
    .select('expires_at')
    .eq('user_id', userId)
    .single()

  const isAuthenticated = !error && tokenData && 
    (!tokenData.expires_at || new Date() < new Date(tokenData.expires_at))

  return new Response(
    JSON.stringify({ authenticated: isAuthenticated }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleLogout(supabase: any, userId: string) {
  await supabase
    .from('google_tokens')
    .delete()
    .eq('user_id', userId)

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleGoogleSheetsOperation(supabase: any, userId: string, body: GoogleSheetsRequest, clientIP: string, userAgent: string) {
  // Get user's Google tokens
  const { data: tokenData, error: tokenError } = await supabase
    .from('google_tokens')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (tokenError || !tokenData) {
    return new Response(
      JSON.stringify({ error: 'Google authentication required' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  let accessToken = tokenData.access_token

  // Check if token needs refresh
  if (tokenData.expires_at && new Date() >= new Date(tokenData.expires_at)) {
    accessToken = await refreshAccessToken(supabase, userId, tokenData.refresh_token)
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'Failed to refresh Google authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  }

  try {
    let result
    if (body.action === 'read_sheet') {
      result = await readGoogleSheet(accessToken, body.sheetId!, body.range)
    } else if (body.action === 'write_sheet') {
      result = await writeGoogleSheet(accessToken, body.sheetId!, body.data!, body.range)
    } else if (body.action === 'create_sheet') {
      result = await createGoogleSheet(accessToken)
    }

    await auditLog(supabase, userId, body.action, body.sheetId || result?.spreadsheetId, clientIP, userAgent, true)

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    await auditLog(supabase, userId, body.action, body.sheetId || null, clientIP, userAgent, false, error.message)
    throw error
  }
}

async function refreshAccessToken(supabase: any, userId: string, refreshToken: string): Promise<string | null> {
  const clientId = Deno.env.get('GOOGLE_SHEETS_CLIENT_ID') || Deno.env.get('GOOGLE_CLIENT_ID')
  const clientSecret = Deno.env.get('GOOGLE_SHEETS_CLIENT_SECRET') || Deno.env.get('GOOGLE_CLIENT_SECRET')

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    return null
  }

  const tokens = await response.json()
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

  // Update stored tokens
  await supabase
    .from('google_tokens')
    .update({
      access_token: tokens.access_token,
      expires_at: expiresAt,
    })
    .eq('user_id', userId)

  return tokens.access_token
}

async function readGoogleSheet(accessToken: string, sheetId: string, range?: string) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range || 'A:Z'}`
  
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })

  if (!response.ok) {
    throw new Error(`Failed to read Google Sheet: ${response.statusText}`)
  }

  return await response.json()
}

async function writeGoogleSheet(accessToken: string, sheetId: string, data: string[][], range?: string) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range || 'A1'}?valueInputOption=RAW`
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: data }),
  })

  if (!response.ok) {
    throw new Error(`Failed to write to Google Sheet: ${response.statusText}`)
  }

  return await response.json()
}

async function createGoogleSheet(accessToken: string) {
  const url = 'https://sheets.googleapis.com/v4/spreadsheets'
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: `New Sheet - ${new Date().toISOString()}`,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to create Google Sheet: ${response.statusText}`)
  }

  return await response.json()
}

async function auditLog(supabase: any, userId: string, action: string, sheetId: string | null, ipAddress: string, userAgent: string, success: boolean, errorMessage?: string) {
  await supabase
    .from('google_sheets_audit_log')
    .insert({
      user_id: userId,
      action,
      sheet_id: sheetId,
      ip_address: ipAddress,
      user_agent: userAgent,
      success,
      error_message: errorMessage || null,
    })
}