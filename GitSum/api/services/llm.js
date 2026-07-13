import { config } from '../config.js';

/**
 * Service to call swappable LLM APIs (Gemini, Anthropic, OpenAI) via standard REST fetch requests.
 */

const ENABLE_AI = process.env.ENABLE_AI_FEATURES === 'true';
const LLM_PROVIDER = process.env.LLM_PROVIDER ?? 'gemini';

/**
 * Invokes the selected LLM provider to generate text.
 * 
 * @param {string} prompt      The main prompt for the LLM
 * @param {string} [system]    Optional system prompt instructions
 * @returns {Promise<string>}  The text response from the model
 */
export async function callLLM(prompt, system = '') {
  if (!ENABLE_AI) {
    throw new Error('AI features are disabled globally via ENABLE_AI_FEATURES.');
  }

  switch (LLM_PROVIDER.toLowerCase()) {
    case 'gemini':
      return callGemini(prompt, system);
    case 'anthropic':
      return callAnthropic(prompt, system);
    case 'openai':
      return callOpenAI(prompt, system);
    default:
      throw new Error(`Unsupported LLM_PROVIDER: ${LLM_PROVIDER}`);
  }
}

/**
 * Call Gemini API using native fetch
 */
async function callGemini(prompt, system) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured in .env file.');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  // Combine system instructions with user prompt for standard models if needed, or pass systemInstruction property
  const payload = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ]
  };

  if (system) {
    payload.systemInstruction = {
      parts: [
        {
          text: system
        }
      ]
    };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response received from Gemini.');
  
  return text;
}

/**
 * Call Anthropic Claude API using native fetch
 */
async function callAnthropic(prompt, system) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured in .env file.');

  const url = 'https://api.anthropic.com/v1/messages';
  const payload = {
    model: 'claude-3-5-sonnet-20240620',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }]
  };

  if (system) {
    payload.system = system;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Anthropic API error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text;
  if (!text) throw new Error('Empty response received from Anthropic.');

  return text;
}

/**
 * Call OpenAI API using native fetch
 */
async function callOpenAI(prompt, system) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured in .env file.');

  const url = 'https://api.openai.com/v1/chat/completions';
  const messages = [];

  if (system) {
    messages.push({ role: 'system', content: system });
  }
  messages.push({ role: 'user', content: prompt });

  const payload = {
    model: 'gpt-4o-mini',
    messages,
    temperature: 0.7
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OpenAI API error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response received from OpenAI.');

  return text;
}

/**
 * Helper to generate Q&A Chat response supporting conversationHistory
 * 
 * @param {string} systemPrompt           Rules and profile facts context
 * @param {Array<{role, content}>} history Conversation history
 * @param {string} userQuestion           The new user question
 */
export async function callLLMChat(systemPrompt, history, userQuestion) {
  if (!ENABLE_AI) {
    throw new Error('AI features are disabled globally via ENABLE_AI_FEATURES.');
  }

  if (LLM_PROVIDER.toLowerCase() === 'gemini') {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not configured in .env file.');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    // Map roles: 'user'/'assistant' are supported in Gemini
    const contents = history.map(h => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }]
    }));
    contents.push({ role: 'user', parts: [{ text: userQuestion }] });

    const payload = {
      contents,
      systemInstruction: { parts: [{ text: systemPrompt }] }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(`Gemini Chat API error: ${res.status}`);
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Empty chat response.';
  }

  if (LLM_PROVIDER.toLowerCase() === 'anthropic') {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured in .env file.');

    const url = 'https://api.anthropic.com/v1/messages';
    const messages = history.map(h => ({
      role: h.role === 'assistant' ? 'assistant' : 'user',
      content: h.content
    }));
    messages.push({ role: 'user', content: userQuestion });

    const payload = {
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 800,
      system: systemPrompt,
      messages
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(`Anthropic Chat API error: ${res.status}`);
    const data = await res.json();
    return data.content?.[0]?.text ?? 'Empty chat response.';
  }

  // Fallback / default to OpenAI format
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured in .env file.');

  const url = 'https://api.openai.com/v1/chat/completions';
  const messages = [{ role: 'system', content: systemPrompt }];
  
  history.forEach(h => {
    messages.push({ role: h.role, content: h.content });
  });
  messages.push({ role: 'user', content: userQuestion });

  const payload = {
    model: 'gpt-4o-mini',
    messages,
    temperature: 0.5
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) throw new Error(`OpenAI Chat API error: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? 'Empty chat response.';
}
