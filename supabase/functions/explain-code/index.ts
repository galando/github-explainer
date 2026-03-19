import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const PRIMARY_MODEL = 'llama-3.3-70b-versatile'
const FALLBACK_MODEL = 'llama-3.1-8b-instant'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// System prompt variants per explanation mode
const MODE_SYSTEM_PROMPTS: Record<string, string> = {
  quick: `You are a senior software engineer. Given repository metadata, write a 2-3 sentence plain-English summary of what the project does and its purpose. Be concise and direct.`,

  beginner: `You are a friendly coding mentor. Given repository metadata, explain what this project does in simple terms that a beginner programmer can understand. Avoid jargon. Use analogies if helpful. Keep it to 3-4 short paragraphs.`,

  technical: `You are a senior software architect. Given repository metadata, provide a detailed technical explanation covering: 1) What the project does, 2) Key architectural decisions, 3) Main technologies and why they were chosen, 4) How data flows through the system, 5) Notable implementation details. Be specific and technical. 4-6 paragraphs.`,

  architect: `You are a software architect reviewing a codebase. Given repository metadata, analyze: 1) Architectural patterns and design decisions, 2) Trade-offs and potential limitations, 3) How the codebase scales, 4) Key abstractions and module boundaries, 5) What makes this architecture notable or unusual. 4-6 paragraphs.`,

  question: `You are a helpful senior developer with deep knowledge of open-source software. Answer the user's specific question about the repository based on the provided metadata. Be direct and practical. If you're not certain about something, say so.`,
}

interface RequestBody {
  type: 'explanation' | 'question'
  content: string
  context?: {
    repoName?: string
    mode?: string
    description?: string
    language?: string
    question?: string
    techStack?: string
    architecture?: string
  }
}

function buildUserPrompt(body: RequestBody): string {
  const { type, content, context } = body

  if (type === 'question') {
    return `Repository: ${context?.repoName ?? 'unknown'}
Description: ${context?.description ?? 'none'}
Primary language: ${context?.language ?? 'unknown'}
Tech stack: ${context?.techStack ?? 'unknown'}
Architecture: ${context?.architecture ?? 'unknown'}

Question: ${content}`
  }

  return `Repository metadata:
${content}

Please provide a ${context?.mode ?? 'quick'} explanation of this repository.`
}

async function callGroq(
  systemPrompt: string,
  userPrompt: string,
  model: string
): Promise<string> {
  const apiKey = Deno.env.get('GROQ_API_KEY')
  if (!apiKey) throw new Error('GROQ_API_KEY not configured')

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
      temperature: 0.4,
      max_tokens: 1024,
      top_p: 0.9,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(`Groq API error ${response.status}: ${JSON.stringify(err)}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content ?? ''
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const body: RequestBody = await req.json()

    if (!body.content) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: content' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    const mode = body.context?.mode ?? (body.type === 'question' ? 'question' : 'quick')
    const systemPrompt = MODE_SYSTEM_PROMPTS[mode] ?? MODE_SYSTEM_PROMPTS.quick
    const userPrompt = buildUserPrompt(body)

    let explanation: string

    try {
      // Try primary model first
      explanation = await callGroq(systemPrompt, userPrompt, PRIMARY_MODEL)
    } catch (primaryErr) {
      console.warn(`Primary model failed, falling back: ${primaryErr}`)
      // Fall back to smaller model
      explanation = await callGroq(systemPrompt, userPrompt, FALLBACK_MODEL)
    }

    return new Response(
      JSON.stringify({ explanation }),
      {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('explain-code function error:', message)
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})
