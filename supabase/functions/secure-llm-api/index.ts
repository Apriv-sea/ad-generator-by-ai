import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LLMRequest {
  provider: 'openai' | 'anthropic' | 'google';
  model: string;
  messages: Array<{ role: string; content: string }>;
  maxTokens?: number;
  temperature?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { provider, model, messages, maxTokens = 2000, temperature = 0.7 }: LLMRequest = await req.json();

    console.log(`🔒 Secure LLM request for user ${user.id}: ${provider}/${model}`);

    // Get decrypted API key using the RPC function
    const { data: apiKey, error: keyError } = await supabaseClient
      .rpc('get_encrypted_api_key', {
        service_name: provider
      });

    if (keyError || !apiKey) {
      console.error('❌ No API key found:', keyError);
      return new Response(
        JSON.stringify({ error: `No API key found for ${provider}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log API key access
    await supabaseClient.from('api_key_access_log').insert({
      user_id: user.id,
      service: provider,
      access_type: 'read',
      success: true
    });

    let response;

    // Call the appropriate LLM provider
    switch (provider) {
      case 'openai':
        response = await callOpenAI(apiKey, model, messages, maxTokens, temperature);
        break;
      case 'anthropic':
        response = await callAnthropic(apiKey, model, messages, maxTokens, temperature);
        break;
      case 'google':
        response = await callGoogle(apiKey, model, messages, maxTokens, temperature);
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    console.log('✅ LLM response received successfully');

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Secure LLM API error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function callOpenAI(apiKey: string, model: string, messages: any[], maxTokens: number, temperature: number) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
  }

  return await response.json();
}

async function callAnthropic(apiKey: string, model: string, messages: any[], maxTokens: number, temperature: number) {
  // Convert OpenAI format to Anthropic format
  const systemMessage = messages.find(m => m.role === 'system');
  const userMessages = messages.filter(m => m.role !== 'system');
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemMessage?.content,
      messages: userMessages,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Anthropic API error: ${error.error?.message || 'Unknown error'}`);
  }

  return await response.json();
}

async function callGoogle(apiKey: string, model: string, messages: any[], maxTokens: number, temperature: number) {
  // Convert to Google format
  const contents = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Google API error: ${error.error?.message || 'Unknown error'}`);
  }

  return await response.json();
}