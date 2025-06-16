
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

    // Get user from token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { prompt, provider, model } = await req.json()

    // Validate required fields
    if (!prompt || !provider || !model) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: prompt, provider, model' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user's API key for the specified provider
    const { data: apiKeyData, error: apiKeyError } = await supabaseClient
      .from('api_keys')
      .select('api_key')
      .eq('service', provider)
      .eq('user_id', user.id)
      .single()

    if (apiKeyError || !apiKeyData) {
      return new Response(
        JSON.stringify({ error: `No API key found for ${provider}. Please add your API key in settings.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const apiKey = apiKeyData.api_key

    // Generate content based on provider
    let response
    switch (provider) {
      case 'openai':
        response = await callOpenAI(apiKey, model, prompt)
        break
      case 'anthropic':
        response = await callAnthropic(apiKey, model, prompt)
        break
      case 'google':
        response = await callGoogle(apiKey, model, prompt)
        break
      default:
        throw new Error(`Unsupported provider: ${provider}`)
    }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in LLM generation:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function callOpenAI(apiKey: string, model: string, prompt: any) {
  const titlePrompt = buildTitlePrompt(prompt)
  const descriptionPrompt = buildDescriptionPrompt(prompt)

  const [titlesResponse, descriptionsResponse] = await Promise.all([
    fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: titlePrompt }],
        max_tokens: 1000,
        temperature: 0.7
      })
    }),
    fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: descriptionPrompt }],
        max_tokens: 1000,
        temperature: 0.7
      })
    })
  ])

  if (!titlesResponse.ok || !descriptionsResponse.ok) {
    const errorText = await (titlesResponse.ok ? descriptionsResponse : titlesResponse).text()
    throw new Error(`OpenAI API Error: ${errorText}`)
  }

  const titlesData = await titlesResponse.json()
  const descriptionsData = await descriptionsResponse.json()

  return {
    titles: parseResponseToArray(titlesData.choices[0].message.content),
    descriptions: parseResponseToArray(descriptionsData.choices[0].message.content),
    provider: 'openai',
    model,
    tokensUsed: (titlesData.usage?.total_tokens || 0) + (descriptionsData.usage?.total_tokens || 0)
  }
}

async function callAnthropic(apiKey: string, model: string, prompt: any) {
  const titlePrompt = buildTitlePrompt(prompt)
  const descriptionPrompt = buildDescriptionPrompt(prompt)

  const [titlesResponse, descriptionsResponse] = await Promise.all([
    fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: 1000,
        messages: [{ role: 'user', content: titlePrompt }]
      })
    }),
    fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: 1000,
        messages: [{ role: 'user', content: descriptionPrompt }]
      })
    })
  ])

  if (!titlesResponse.ok || !descriptionsResponse.ok) {
    const errorText = await (titlesResponse.ok ? descriptionsResponse : titlesResponse).text()
    throw new Error(`Anthropic API Error: ${errorText}`)
  }

  const titlesData = await titlesResponse.json()
  const descriptionsData = await descriptionsResponse.json()

  return {
    titles: parseResponseToArray(titlesData.content[0].text),
    descriptions: parseResponseToArray(descriptionsData.content[0].text),
    provider: 'anthropic',
    model
  }
}

async function callGoogle(apiKey: string, model: string, prompt: any) {
  const titlePrompt = buildTitlePrompt(prompt)
  const descriptionPrompt = buildDescriptionPrompt(prompt)

  const [titlesResponse, descriptionsResponse] = await Promise.all([
    fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: titlePrompt }] }],
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7
        }
      })
    }),
    fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: descriptionPrompt }] }],
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7
        }
      })
    })
  ])

  if (!titlesResponse.ok || !descriptionsResponse.ok) {
    const errorText = await (titlesResponse.ok ? descriptionsResponse : titlesResponse).text()
    throw new Error(`Google API Error: ${errorText}`)
  }

  const titlesData = await titlesResponse.json()
  const descriptionsData = await descriptionsResponse.json()

  return {
    titles: parseResponseToArray(titlesData.candidates[0].content.parts[0].text),
    descriptions: parseResponseToArray(descriptionsData.candidates[0].content.parts[0].text),
    provider: 'google',
    model
  }
}

function buildTitlePrompt(prompt: any): string {
  return `Vous êtes un rédacteur publicitaire hautement qualifié avec une solide expérience en rédaction persuasive, en optimisation des conversions et en techniques de marketing.

En vous basant sur les informations concernant l'annonceur : '''${prompt.clientContext}''', 
et sur le role de la campagne : '''${prompt.campaignContext}''',
ainsi que sur le nom de l'ad group : '''${prompt.adGroupContext}''', 
enfin il faut utiliser les top mots clés de l'ad group : ${prompt.keywords.join(', ')} pour bien identifier l'univers sémantique.

Rédigez une liste de 10 titres à la fois sobres et engageants pour les annonces Google en ne mentionnant la marque seulement que pour 5 titres, alignés avec le sujet de l'ad group en respectant strictement 30 caractères maximum, ne pas proposer si ça dépasse. Affichez uniquement la liste sans aucun texte préliminaire ou conclusion. Pas de mise en forme particulière, chaque titre doit être l'une en dessous de l'autre sans numéro ou tiret ou police particulière.`
}

function buildDescriptionPrompt(prompt: any): string {
  return `Vous êtes un rédacteur publicitaire hautement qualifié avec une solide expérience en rédaction persuasive, en optimisation des conversions et en techniques de marketing.

En vous basant sur les informations concernant l'annonceur : '''${prompt.clientContext}''', 
et sur le role de la campagne : '''${prompt.campaignContext}''',
ainsi que sur le nom de l'ad group : '''${prompt.adGroupContext}''', 
enfin il faut utiliser les top mots clés de l'ad group : ${prompt.keywords.join(', ')} pour bien identifier l'univers sémantique.

Rédigez une liste de 5 descriptions d'annonces Google persuasives et engageantes en respectant strictement 90 caractères maximum, ne pas proposer si ça dépasse. Incluez un appel à l'action clair dans chaque description. Affichez uniquement la liste sans aucun texte préliminaire ou conclusion. Pas de mise en forme particulière, chaque description doit être l'une en dessous de l'autre sans numéro ou tiret.`
}

function parseResponseToArray(text: string): string[] {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.match(/^\d+\./) && !line.startsWith('-'))
    .slice(0, 10)
}
