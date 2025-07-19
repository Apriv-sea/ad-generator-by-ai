import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TestKeyRequest {
  provider: 'openai' | 'anthropic' | 'google'
  apiKey: string
}

Deno.serve(async (req) => {
  console.log('🔑 Test API Key called:', req.method, req.url)

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

    const { provider, apiKey }: TestKeyRequest = await req.json()
    console.log('🧪 Testing API key for provider:', provider)

    // Test the API key
    let isValid = false
    let models: string[] = []

    switch (provider) {
      case 'openai':
        ({ isValid, models } = await testOpenAI(apiKey))
        break
      case 'anthropic':
        ({ isValid, models } = await testAnthropic(apiKey))
        break
      case 'google':
        ({ isValid, models } = await testGoogle(apiKey))
        break
      default:
        throw new Error(`Unsupported provider: ${provider}`)
    }

    console.log('✅ API key test result:', { provider, isValid, modelsCount: models.length })

    return new Response(JSON.stringify({ 
      isValid, 
      models,
      provider 
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    console.error('💥 Error testing API key:', error)
    return new Response(
      JSON.stringify({ 
        isValid: false, 
        error: error.message 
      }), 
      { status: 500, headers: corsHeaders }
    )
  }
})

async function testOpenAI(apiKey: string) {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      }
    })

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, await response.text())
      return { isValid: false, models: [] }
    }

    const data = await response.json()
    const models = data.data?.map((model: any) => model.id) || []
    
    return { 
      isValid: true, 
      models: models.filter((id: string) => 
        id.includes('gpt') || id.includes('text-davinci') || id.includes('text-embedding')
      )
    }
  } catch (error) {
    console.error('Error testing OpenAI key:', error)
    return { isValid: false, models: [] }
  }
}

async function testAnthropic(apiKey: string) {
  try {
    // Test with a simple message
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }]
      })
    })

    const isValid = response.ok
    const models = isValid ? [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229', 
      'claude-3-haiku-20240307',
      'claude-3-5-sonnet-20241022'
    ] : []

    return { isValid, models }
  } catch (error) {
    console.error('Error testing Anthropic key:', error)
    return { isValid: false, models: [] }
  }
}

async function testGoogle(apiKey: string) {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
    
    if (!response.ok) {
      console.error('Google API error:', response.status, await response.text())
      return { isValid: false, models: [] }
    }

    const data = await response.json()
    const models = data.models?.map((model: any) => model.name.replace('models/', '')) || []
    
    return { 
      isValid: true, 
      models: models.filter((name: string) => 
        name.includes('gemini') || name.includes('text-bison') || name.includes('chat-bison')
      )
    }
  } catch (error) {
    console.error('Error testing Google key:', error)
    return { isValid: false, models: [] }
  }
}