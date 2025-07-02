
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Vérifier l'authentification
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { provider } = await req.json()

    if (!provider) {
      return new Response(
        JSON.stringify({ error: 'Provider is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Récupérer la clé API de l'utilisateur
    const { data: apiKeyData, error: apiKeyError } = await supabaseClient
      .from('api_keys')
      .select('api_key')
      .eq('service', provider)
      .eq('user_id', user.id)
      .single()

    if (apiKeyError || !apiKeyData) {
      return new Response(
        JSON.stringify({ 
          models: [],
          error: `No API key found for ${provider}` 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const apiKey = apiKeyData.api_key
    let models = []

    try {
      switch (provider) {
        case 'openai':
          models = await discoverOpenAIModels(apiKey)
          break
        case 'anthropic':
          models = await discoverAnthropicModels(apiKey)
          break
        case 'google':
          models = await discoverGoogleModels(apiKey)
          break
        default:
          throw new Error(`Unsupported provider: ${provider}`)
      }

      return new Response(
        JSON.stringify({ models }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (error) {
      console.error(`Error discovering models for ${provider}:`, error)
      return new Response(
        JSON.stringify({ 
          models: [],
          error: error.message 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Error in discover-models function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function discoverAnthropicModels(apiKey: string) {
  // Anthropic n'expose plus l'endpoint /v1/models
  // On retourne une liste statique des modèles disponibles
  console.log('🔍 Utilisation de la liste statique des modèles Anthropic (API ne supporte plus /v1/models)')
  
  // Valider la clé API avec un simple appel pour s'assurer qu'elle fonctionne
  try {
    const testResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3.5-haiku',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'test' }]
      })
    })

    if (!testResponse.ok && testResponse.status !== 400) {
      // Status 400 est normal pour ce test (paramètres invalides), mais l'auth fonctionne
      // Autres erreurs indiquent un problème d'authentification
      throw new Error(`Anthropic API Error: ${testResponse.statusText}`)
    }
  } catch (error) {
    console.error('Erreur validation clé Anthropic:', error)
    throw new Error(`Invalid Anthropic API key: ${error.message}`)
  }

  // Retourner la liste statique des modèles Anthropic disponibles
  const staticModels = [
    {
      id: 'claude-4-opus-20250514',
      name: 'Claude 4 Opus',
      description: 'Le modèle le plus puissant de Claude 4 avec capacités de raisonnement supérieures',
      contextWindow: 200000,
      supportsVision: true
    },
    {
      id: 'claude-4-sonnet-20250514',
      name: 'Claude 4 Sonnet',
      description: 'Modèle haute performance avec raisonnement exceptionnel et efficacité',
      contextWindow: 200000,
      supportsVision: true
    },
    {
      id: 'claude-3.5-haiku-20241022',
      name: 'Claude 3.5 Haiku',
      description: 'Le modèle le plus rapide pour les réponses instantanées',
      contextWindow: 200000,
      supportsVision: true
    },
    {
      id: 'claude-3.5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet',
      description: 'Modèle intelligent précédent (remplacé par Sonnet 4)',
      contextWindow: 200000,
      supportsVision: true
    },
    {
      id: 'claude-3-opus-20240229',
      name: 'Claude 3 Opus',
      description: 'Modèle puissant mais plus ancien que Claude 4',
      contextWindow: 200000,
      supportsVision: true
    }
  ]

  return staticModels.sort((a, b) => {
    // Prioriser les modèles Claude 4, puis 3.5, puis 3
    if (a.id.includes('claude-4') && !b.id.includes('claude-4')) return -1
    if (!a.id.includes('claude-4') && b.id.includes('claude-4')) return 1
    if (a.id.includes('3.5') && !b.id.includes('3.5')) return -1
    if (!a.id.includes('3.5') && b.id.includes('3.5')) return 1
    return a.name.localeCompare(b.name)
  })
}

async function discoverOpenAIModels(apiKey: string) {
  const response = await fetch('https://api.openai.com/v1/models', {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  })

  if (!response.ok) {
    throw new Error(`OpenAI API Error: ${response.statusText}`)
  }

  const data = await response.json()
  
  // Filtrer et mapper les modèles GPT uniquement
  const gptModels = data.data
    .filter((model: any) => 
      model.id.includes('gpt') || 
      model.id.includes('o1') ||
      model.id.includes('text-davinci')
    )
    .map((model: any) => ({
      id: model.id,
      name: getOpenAIModelDisplayName(model.id),
      description: getOpenAIModelDescription(model.id),
      contextWindow: getOpenAIContextWindow(model.id),
      supportsVision: model.id.includes('gpt-4') && !model.id.includes('gpt-4-turbo-preview')
    }))

  return gptModels.sort((a: any, b: any) => {
    // Prioriser les modèles les plus récents
    const priority = ['gpt-4', 'gpt-3.5', 'o1']
    for (const p of priority) {
      if (a.id.includes(p) && !b.id.includes(p)) return -1
      if (!a.id.includes(p) && b.id.includes(p)) return 1
    }
    return a.name.localeCompare(b.name)
  })
}

async function discoverGoogleModels(apiKey: string) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)

  if (!response.ok) {
    throw new Error(`Google API Error: ${response.statusText}`)
  }

  const data = await response.json()
  
  return data.models
    .filter((model: any) => 
      model.name.includes('gemini') && 
      model.supportedGenerationMethods?.includes('generateContent')
    )
    .map((model: any) => ({
      id: model.name.split('/').pop(),
      name: getGoogleModelDisplayName(model.name),
      description: model.description || 'Modèle Google Gemini',
      contextWindow: model.inputTokenLimit || 30720,
      supportsVision: model.name.includes('vision') || model.name.includes('pro')
    }))
}

function getOpenAIModelDisplayName(id: string): string {
  const names: { [key: string]: string } = {
    'gpt-4-turbo': 'GPT-4 Turbo',
    'gpt-4': 'GPT-4',
    'gpt-3.5-turbo': 'GPT-3.5 Turbo',
    'o1-preview': 'O1 Preview',
    'o1-mini': 'O1 Mini'
  }
  
  for (const [key, name] of Object.entries(names)) {
    if (id.includes(key)) return name
  }
  
  return id.toUpperCase()
}

function getOpenAIModelDescription(id: string): string {
  if (id.includes('gpt-4-turbo')) return 'Modèle GPT-4 le plus récent, optimisé pour la vitesse'
  if (id.includes('gpt-4')) return 'Modèle GPT-4 de haute qualité'
  if (id.includes('gpt-3.5')) return 'Modèle rapide et économique'
  if (id.includes('o1')) return 'Modèle de raisonnement avancé'
  return 'Modèle OpenAI'
}

function getOpenAIContextWindow(id: string): number {
  if (id.includes('gpt-4-turbo')) return 128000
  if (id.includes('gpt-4')) return 8192
  if (id.includes('gpt-3.5-turbo')) return 16385
  if (id.includes('o1')) return 128000
  return 4096
}

function getGoogleModelDisplayName(name: string): string {
  if (name.includes('gemini-pro')) return 'Gemini Pro'
  if (name.includes('gemini-pro-vision')) return 'Gemini Pro Vision'
  if (name.includes('gemini-ultra')) return 'Gemini Ultra'
  return name.split('/').pop()?.replace('gemini-', 'Gemini ') || name
}
