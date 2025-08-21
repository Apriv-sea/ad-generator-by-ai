
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

    // Récupérer la clé API déchiffrée de l'utilisateur
    console.log(`🔍 Tentative de récupération de la clé API pour ${provider}`)
    
    const { data: apiKey, error: apiKeyError } = await supabaseClient
      .rpc('get_encrypted_api_key', {
        service_name: provider
      })

    console.log(`🔍 Résultat récupération clé API pour ${provider}:`, { 
      hasApiKey: !!apiKey, 
      error: apiKeyError?.message,
      userId: user.id
    })

    if (apiKeyError || !apiKey) {
      console.error(`❌ Aucune clé API trouvée pour ${provider}:`, apiKeyError)
      return new Response(
        JSON.stringify({ 
          models: [],
          error: `No API key found for ${provider}` 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`✅ Clé API récupérée avec succès pour ${provider}`)
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
  console.log('🔍 Récupération des modèles Anthropic via API officielle')
  
  const response = await fetch('https://api.anthropic.com/v1/models', {
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    }
  })

  if (!response.ok) {
    throw new Error(`Anthropic API Error: ${response.statusText}`)
  }

  const data = await response.json()
  
  // Mapper les modèles depuis l'API réelle
  const models = data.data.map((model: any) => ({
    id: model.id,
    name: model.display_name || getAnthropicModelDisplayName(model.id),
    description: getAnthropicModelDescription(model.id),
    contextWindow: 200000, // Standard Anthropic context window
    supportsVision: true, // Tous les modèles Claude récents supportent la vision
    createdAt: model.created_at
  }))

  // Trier par date de création (plus récent en premier)
  return models.sort((a: any, b: any) => {
    if (a.createdAt && b.createdAt) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
    // Fallback sur priorité par nom
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
      supportsVision: model.id.includes('gpt-4') && !model.id.includes('gpt-4-turbo-preview'),
      created: model.created
    }))

  // Dédupliquer les modèles par famille (garder le plus récent de chaque famille)
  const modelFamilies = new Map()
  
  gptModels.forEach((model: any) => {
    let family = model.id
    
    // Identifier la famille du modèle (supprimer les dates et versions spécifiques)
    if (model.id.includes('gpt-4-turbo')) family = 'gpt-4-turbo'
    else if (model.id.includes('gpt-4o-mini')) family = 'gpt-4o-mini'
    else if (model.id.includes('gpt-4o')) family = 'gpt-4o'
    else if (model.id.includes('gpt-4')) family = 'gpt-4'
    else if (model.id.includes('gpt-3.5-turbo')) family = 'gpt-3.5-turbo'
    else if (model.id.includes('o1-preview')) family = 'o1-preview'
    else if (model.id.includes('o1-mini')) family = 'o1-mini'
    else if (model.id.includes('text-davinci')) family = 'text-davinci'
    
    // Garder le modèle le plus récent de chaque famille
    if (!modelFamilies.has(family) || 
        (model.created && model.created > modelFamilies.get(family).created)) {
      modelFamilies.set(family, model)
    }
  })

  const uniqueModels = Array.from(modelFamilies.values())

  return uniqueModels.sort((a: any, b: any) => {
    // Prioriser les modèles les plus récents
    const priority = ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5', 'o1']
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

function getAnthropicModelDisplayName(id: string): string {
  const names: { [key: string]: string } = {
    'claude-opus-4': 'Claude 4 Opus',
    'claude-sonnet-4': 'Claude 4 Sonnet', 
    'claude-3-7-sonnet': 'Claude 3.7 Sonnet',
    'claude-3.5-sonnet': 'Claude 3.5 Sonnet',
    'claude-3.5-haiku': 'Claude 3.5 Haiku',
    'claude-3-opus': 'Claude 3 Opus',
    'claude-3-sonnet': 'Claude 3 Sonnet',
    'claude-3-haiku': 'Claude 3 Haiku'
  }
  
  for (const [key, name] of Object.entries(names)) {
    if (id.includes(key)) return name
  }
  
  return id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

function getAnthropicModelDescription(id: string): string {
  if (id.includes('claude-opus-4')) return 'Le modèle le plus puissant de Claude 4 avec capacités de raisonnement supérieures'
  if (id.includes('claude-sonnet-4')) return 'Modèle haute performance avec raisonnement exceptionnel et efficacité'
  if (id.includes('claude-3-7-sonnet')) return 'Modèle Claude 3.7 avec capacités de raisonnement étendues'
  if (id.includes('claude-3.5-sonnet')) return 'Modèle intelligent de génération 3.5'
  if (id.includes('claude-3.5-haiku')) return 'Le modèle le plus rapide pour les réponses instantanées'
  if (id.includes('claude-3-opus')) return 'Modèle puissant de génération 3'
  if (id.includes('claude-3-sonnet')) return 'Modèle équilibré de génération 3'
  if (id.includes('claude-3-haiku')) return 'Modèle rapide et économique de génération 3'
  return 'Modèle Anthropic Claude'
}

function getGoogleModelDisplayName(name: string): string {
  const modelId = name.split('/').pop() || name
  
  if (modelId.includes('gemini-2.0')) return 'Gemini 2.0 Flash'
  if (modelId.includes('gemini-1.5-pro')) return 'Gemini 1.5 Pro'
  if (modelId.includes('gemini-1.5-flash')) return 'Gemini 1.5 Flash'
  if (modelId.includes('gemini-pro')) return 'Gemini Pro'
  if (modelId.includes('gemini-pro-vision')) return 'Gemini Pro Vision'
  if (modelId.includes('gemini-ultra')) return 'Gemini Ultra'
  
  return modelId.replace('gemini-', 'Gemini ').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}
