
import { GenerationPrompt } from "../types";
import { toast } from "sonner";

export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'google';
  model: string;
  apiKey: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMResponse {
  titles: string[];
  descriptions: string[];
  provider: string;
  model: string;
  tokensUsed?: number;
}

export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

class LLMApiService {
  private defaultRetryOptions: RetryOptions = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000
  };

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private calculateBackoffDelay(attempt: number, baseDelay: number, maxDelay: number): number {
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    return Math.min(exponentialDelay, maxDelay);
  }

  private async callOpenAI(config: LLMConfig, prompt: GenerationPrompt): Promise<LLMResponse> {
    const titlePrompt = this.buildTitlePrompt(prompt);
    const descriptionPrompt = this.buildDescriptionPrompt(prompt);

    console.log("Appel API OpenAI avec le modèle:", config.model);

    const [titlesResponse, descriptionsResponse] = await Promise.all([
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'user', content: titlePrompt }],
          max_tokens: config.maxTokens || 1000,
          temperature: config.temperature || 0.7
        })
      }),
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'user', content: descriptionPrompt }],
          max_tokens: config.maxTokens || 1000,
          temperature: config.temperature || 0.7
        })
      })
    ]);

    if (!titlesResponse.ok || !descriptionsResponse.ok) {
      const error = await (titlesResponse.ok ? descriptionsResponse : titlesResponse).text();
      throw new Error(`OpenAI API Error: ${error}`);
    }

    const titlesData = await titlesResponse.json();
    const descriptionsData = await descriptionsResponse.json();

    const titles = this.parseResponseToArray(titlesData.choices[0].message.content);
    const descriptions = this.parseResponseToArray(descriptionsData.choices[0].message.content);

    return {
      titles,
      descriptions,
      provider: 'openai',
      model: config.model,
      tokensUsed: (titlesData.usage?.total_tokens || 0) + (descriptionsData.usage?.total_tokens || 0)
    };
  }

  private async callAnthropic(config: LLMConfig, prompt: GenerationPrompt): Promise<LLMResponse> {
    const titlePrompt = this.buildTitlePrompt(prompt);
    const descriptionPrompt = this.buildDescriptionPrompt(prompt);

    console.log("Appel API Anthropic avec le modèle:", config.model);

    const [titlesResponse, descriptionsResponse] = await Promise.all([
      fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': config.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: config.maxTokens || 1000,
          messages: [{ role: 'user', content: titlePrompt }]
        })
      }),
      fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': config.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: config.maxTokens || 1000,
          messages: [{ role: 'user', content: descriptionPrompt }]
        })
      })
    ]);

    if (!titlesResponse.ok || !descriptionsResponse.ok) {
      const error = await (titlesResponse.ok ? descriptionsResponse : titlesResponse).text();
      throw new Error(`Anthropic API Error: ${error}`);
    }

    const titlesData = await titlesResponse.json();
    const descriptionsData = await descriptionsResponse.json();

    const titles = this.parseResponseToArray(titlesData.content[0].text);
    const descriptions = this.parseResponseToArray(descriptionsData.content[0].text);

    return {
      titles,
      descriptions,
      provider: 'anthropic',
      model: config.model
    };
  }

  private async callGoogle(config: LLMConfig, prompt: GenerationPrompt): Promise<LLMResponse> {
    const titlePrompt = this.buildTitlePrompt(prompt);
    const descriptionPrompt = this.buildDescriptionPrompt(prompt);

    console.log("Appel API Google avec le modèle:", config.model);

    const [titlesResponse, descriptionsResponse] = await Promise.all([
      fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: titlePrompt }] }],
          generationConfig: {
            maxOutputTokens: config.maxTokens || 1000,
            temperature: config.temperature || 0.7
          }
        })
      }),
      fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: descriptionPrompt }] }],
          generationConfig: {
            maxOutputTokens: config.maxTokens || 1000,
            temperature: config.temperature || 0.7
          }
        })
      })
    ]);

    if (!titlesResponse.ok || !descriptionsResponse.ok) {
      const error = await (titlesResponse.ok ? descriptionsResponse : titlesResponse).text();
      throw new Error(`Google API Error: ${error}`);
    }

    const titlesData = await titlesResponse.json();
    const descriptionsData = await descriptionsResponse.json();

    const titles = this.parseResponseToArray(titlesData.candidates[0].content.parts[0].text);
    const descriptions = this.parseResponseToArray(descriptionsData.candidates[0].content.parts[0].text);

    return {
      titles,
      descriptions,
      provider: 'google',
      model: config.model
    };
  }

  private buildTitlePrompt(prompt: GenerationPrompt): string {
    return `Vous êtes un rédacteur publicitaire hautement qualifié avec une solide expérience en rédaction persuasive, en optimisation des conversions et en techniques de marketing.

En vous basant sur les informations concernant l'annonceur : '''${prompt.clientContext}''', 
et sur le role de la campagne : '''${prompt.campaignContext}''',
ainsi que sur le nom de l'ad group : '''${prompt.adGroupContext}''', 
enfin il faut utiliser les top mots clés de l'ad group : ${prompt.keywords.join(', ')} pour bien identifier l'univers sémantique.

Rédigez une liste de 10 titres à la fois sobres et engageants pour les annonces Google en ne mentionnant la marque seulement que pour 5 titres, alignés avec le sujet de l'ad group en respectant strictement 30 caractères maximum, ne pas proposer si ça dépasse. Affichez uniquement la liste sans aucun texte préliminaire ou conclusion. Pas de mise en forme particulière, chaque titre doit être l'une en dessous de l'autre sans numéro ou tiret ou police particulière.`;
  }

  private buildDescriptionPrompt(prompt: GenerationPrompt): string {
    return `Vous êtes un rédacteur publicitaire hautement qualifié avec une solide expérience en rédaction persuasive, en optimisation des conversions et en techniques de marketing.

En vous basant sur les informations concernant l'annonceur : '''${prompt.clientContext}''', 
et sur le role de la campagne : '''${prompt.campaignContext}''',
ainsi que sur le nom de l'ad group : '''${prompt.adGroupContext}''', 
enfin il faut utiliser les top mots clés de l'ad group : ${prompt.keywords.join(', ')} pour bien identifier l'univers sémantique.

Rédigez une liste de 5 descriptions d'annonces Google persuasives et engageantes en respectant strictement 90 caractères maximum, ne pas proposer si ça dépasse. Incluez un appel à l'action clair dans chaque description. Affichez uniquement la liste sans aucun texte préliminaire ou conclusion. Pas de mise en forme particulière, chaque description doit être l'une en dessous de l'autre sans numéro ou tiret.`;
  }

  private parseResponseToArray(text: string): string[] {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.match(/^\d+\./) && !line.startsWith('-'))
      .slice(0, 10); // Limite de sécurité
  }

  async generateContentWithRetry(configs: LLMConfig[], prompt: GenerationPrompt, retryOptions?: Partial<RetryOptions>): Promise<LLMResponse> {
    const options = { ...this.defaultRetryOptions, ...retryOptions };
    let lastError: Error | null = null;

    // Essayer chaque configuration (fallback entre providers)
    for (const config of configs) {
      console.log(`Tentative avec ${config.provider} - ${config.model}`);
      
      for (let attempt = 0; attempt < options.maxRetries; attempt++) {
        try {
          let response: LLMResponse;

          switch (config.provider) {
            case 'openai':
              response = await this.callOpenAI(config, prompt);
              break;
            case 'anthropic':
              response = await this.callAnthropic(config, prompt);
              break;
            case 'google':
              response = await this.callGoogle(config, prompt);
              break;
            default:
              throw new Error(`Provider non supporté: ${config.provider}`);
          }

          console.log(`Succès avec ${config.provider} - ${config.model}`);
          return response;

        } catch (error) {
          lastError = error as Error;
          console.error(`Erreur tentative ${attempt + 1}/${options.maxRetries} avec ${config.provider}:`, error);

          // Si c'est la dernière tentative pour ce provider, passer au suivant
          if (attempt === options.maxRetries - 1) {
            break;
          }

          // Attendre avant de réessayer
          const delay = this.calculateBackoffDelay(attempt, options.baseDelay, options.maxDelay);
          console.log(`Attente de ${delay}ms avant nouvelle tentative...`);
          await this.delay(delay);
        }
      }
    }

    // Si tous les providers ont échoué
    throw new Error(`Tous les providers ont échoué. Dernière erreur: ${lastError?.message}`);
  }
}

export const llmApiService = new LLMApiService();
