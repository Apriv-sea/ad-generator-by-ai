import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LLMRequest {
  provider: 'openai' | 'anthropic' | 'google'
  model: string
  messages: Array<{ role: string; content: string }>
  maxTokens?: number
  temperature?: number
}

Deno.serve(async (req) => {
  console.log('🚀 Secure LLM API called:', req.method, req.url)

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get authenticated user
    const authHeader = req.headers.get('authorization')!
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: corsHeaders }
      )
    }

    console.log('✅ User authenticated:', user.id)

    const requestBody: LLMRequest = await req.json()
    const { provider, model, messages, maxTokens = 1000, temperature = 0.7 } = requestBody

    console.log('📋 Request details:', { provider, model, messagesCount: messages.length })

    // Get user's API key for the provider
    const { data: apiKeyData, error: keyError } = await supabase
      .from('api_keys')
      .select('api_key')
      .eq('user_id', user.id)
      .eq('service', provider)
      .single()

    if (keyError || !apiKeyData) {
      console.error('❌ API key not found:', keyError)
      return new Response(
        JSON.stringify({ error: `No API key found for ${provider}` }), 
        { status: 400, headers: corsHeaders }
      )
    }

    console.log('🔑 API key found for provider:', provider)

    // Make request to appropriate LLM provider
    let response: Response
    
    switch (provider) {
      case 'openai':
        response = await callOpenAI(apiKeyData.api_key, model, messages, maxTokens, temperature)
        break
      case 'anthropic':
        response = await callAnthropic(apiKeyData.api_key, model, messages, maxTokens, temperature)
        break
      case 'google':
        response = await callGoogle(apiKeyData.api_key, model, messages, maxTokens, temperature)
        break
      default:
        throw new Error(`Unsupported provider: ${provider}`)
    }

    const result = await response.json()
    console.log('✅ LLM response received successfully')

    return new Response(JSON.stringify(result), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    console.error('💥 Error in secure LLM API:', error)
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: corsHeaders }
    )
  }
})

async function callOpenAI(apiKey: string, model: string, messages: any[], maxTokens: number, temperature: number) {
  console.log('🤖 Calling OpenAI API')
  
  return await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
    })
  })
}

async function callAnthropic(apiKey: string, model: string, messages: any[], maxTokens: number, temperature: number) {
  console.log('🤖 Calling Anthropic API')
  
  // Convert OpenAI format to Anthropic format
  const systemMessage = messages.find(m => m.role === 'system')?.content || ''
  const userMessages = messages.filter(m => m.role !== 'system')
  
  return await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemMessage,
      messages: userMessages
    })
  })
}

async function callGoogle(apiKey: string, model: string, messages: any[], maxTokens: number, temperature: number) {
  console.log('🤖 Calling Google API')
  
  // Convert to Google's format
  const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n')
  
  return await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature,
      }
    })
  })
}