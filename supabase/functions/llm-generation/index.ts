
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Input sanitization functions
function sanitizePrompt(prompt: string): string {
  if (!prompt || typeof prompt !== 'string') return '';
  
  return prompt
    .replace(/\b(ignore|forget|disregard)\s+(previous|above|all)\s+(instructions|prompts?|context)/gi, '')
    .replace(/\b(system|admin|root|execute|eval|script)/gi, '')
    .replace(/[<>{}]/g, '')
    .trim();
    // SUPPRESSION de .substring(0, 2000) pour permettre des prompts plus longs
}

function validateInputs(requestData: any): { isValid: boolean; error?: string } {
  // Check required fields
  if (!requestData.prompt || typeof requestData.prompt !== 'string') {
    return { isValid: false, error: 'Prompt is required and must be a string' };
  }
  
  if (!requestData.provider || typeof requestData.provider !== 'string') {
    return { isValid: false, error: 'Provider is required' };
  }
  
  if (!requestData.model || typeof requestData.model !== 'string') {
    return { isValid: false, error: 'Model is required' };
  }
  
  // SUPPRESSION de la validation de longueur restrictive
  // Garde seulement une limite de sécurité très haute pour éviter les abus
  if (requestData.prompt.length > 50000) {
    return { isValid: false, error: 'Prompt too long (max 50000 characters)' };
  }
  
  // Validate provider
  const allowedProviders = ['openai', 'anthropic', 'google'];
  if (!allowedProviders.includes(requestData.provider.toLowerCase())) {
    return { isValid: false, error: 'Invalid provider' };
  }
  
  return { isValid: true };
}

function logSecurityEvent(event: string, details: any = {}) {
  console.log(`🔒 Security Event: ${event}`, {
    timestamp: new Date().toISOString(),
    ...details
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      logSecurityEvent('UNAUTHORIZED_REQUEST', { ip: req.headers.get('x-forwarded-for') });
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      logSecurityEvent('AUTH_VERIFICATION_FAILED', { error: authError?.message });
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse and validate request body
    const requestData = await req.json()
    const validation = validateInputs(requestData)
    
    if (!validation.isValid) {
      logSecurityEvent('INVALID_INPUT', { 
        userId: user.id, 
        error: validation.error,
        data: requestData 
      });
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Sanitize inputs
    const sanitizedPrompt = sanitizePrompt(requestData.prompt);
    const sanitizedProvider = requestData.provider.toLowerCase().trim();
    const sanitizedModel = requestData.model.trim();

    logSecurityEvent('LLM_REQUEST', { 
      userId: user.id, 
      provider: sanitizedProvider,
      model: sanitizedModel,
      promptLength: sanitizedPrompt.length
    });

    // Get API key from user's stored keys
    const { data: apiKeys, error: keyError } = await supabaseClient
      .from('api_keys')
      .select('api_key')
      .eq('user_id', user.id)
      .eq('service', sanitizedProvider)
      .single()

    if (keyError || !apiKeys) {
      logSecurityEvent('API_KEY_NOT_FOUND', { userId: user.id, provider: sanitizedProvider });
      return new Response(
        JSON.stringify({ error: `API key not found for ${sanitizedProvider}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Rate limiting check (basic implementation)
    const rateLimitKey = `rate_limit_${user.id}`;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 30; // 30 requests per minute
    
    // In a real implementation, you'd use Redis or similar for rate limiting
    // For now, we'll just log the request
    logSecurityEvent('RATE_LIMIT_CHECK', { 
      userId: user.id, 
      timestamp: now 
    });

    // Make API call based on provider
    let response;
    
    if (sanitizedProvider === 'openai') {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKeys.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: sanitizedModel,
          messages: [
            { role: 'user', content: sanitizedPrompt }
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });
    } else if (sanitizedProvider === 'anthropic') {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKeys.api_key,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: sanitizedModel,
          max_tokens: 1000,
          messages: [
            { role: 'user', content: sanitizedPrompt }
          ],
        }),
      });
    } else {
      return new Response(
        JSON.stringify({ error: 'Provider not supported yet' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!response.ok) {
      const errorText = await response.text();
      logSecurityEvent('LLM_API_ERROR', { 
        userId: user.id, 
        provider: sanitizedProvider,
        status: response.status,
        error: errorText
      });
      
      return new Response(
        JSON.stringify({ error: 'Failed to generate content' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json();
    
    logSecurityEvent('LLM_SUCCESS', { 
      userId: user.id, 
      provider: sanitizedProvider,
      tokensUsed: data.usage?.total_tokens || 0
    });

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    logSecurityEvent('LLM_FUNCTION_ERROR', { error: error.message });
    console.error('Error in LLM generation function:', error)
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
