
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

async function discoverAnthropicModels(apiKey: string) {
  // Anthropic ne fournit pas d'endpoint public pour lister les modèles
  // Mais nous pouvons vérifier la validité de la clé API en faisant un petit appel test
  try {
    const testResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'test' }]
      })
    })

    // Si la clé API est invalide, Anthropic retourne 401
    if (testResponse.status === 401) {
      throw new Error('Invalid API key')
    }

    // Retourner la liste complète et mise à jour des modèles Claude
    return [
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet (Nouveau)',
        description: 'Le modèle le plus récent et performant de Claude 3.5',
        contextWindow: 200000,
        supportsVision: true
      },
      {
        id: 'claude-3-5-sonnet-20240620',
        name: 'Claude 3.5 Sonnet',
        description: 'Version précédente de Claude 3.5 Sonnet',
        contextWindow: 200000,
        supportsVision: true
      },
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        description: 'Le modèle le plus puissant pour les tâches complexes',
        contextWindow: 200000,
        supportsVision: true
      },
      {
        id: 'claude-3-sonnet-20240229',
        name: 'Claude 3 Sonnet',
        description: 'Équilibre performance et rapidité',
        contextWindow: 200000,
        supportsVision: true
      },
      {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        description: 'Le plus rapide pour les réponses instantanées',
        contextWindow: 200000,
        supportsVision: true
      }
    ]
  } catch (error) {
    // En cas d'erreur, retourner une liste de base pour éviter une interface vide
    console.error('Error testing Anthropic API key:', error)
    return [
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        description: 'Modèle le plus récent et performant de Claude',
        contextWindow: 200000,
        supportsVision: true
      },
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        description: 'Le modèle le plus puissant pour les tâches complexes',
        contextWindow: 200000,
        supportsVision: true
      },
      {
        id: 'claude-3-sonnet-20240229',
        name: 'Claude 3 Sonnet',
        description: 'Équilibre performance et rapidité',
        contextWindow: 200000,
        supportsVision: true
      },
      {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        description: 'Le plus rapide pour les réponses instantanées',
        contextWindow: 200000,
        supportsVision: true
      }
    ]
  }
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
