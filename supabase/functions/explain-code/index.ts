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
  quick: `You are a senior software engineer. Given repository metadata, write a 2-3 sentence plain-English summary covering:
- What the project does and who it's for
- Main technology stack (frameworks, languages)
- Notable characteristics (popularity, activity, architecture style)
Be concise and direct. Avoid generic phrases.`,

  beginner: `You are a friendly coding mentor. Given repository metadata, explain what this project does in simple terms that a beginner programmer can understand. Cover:
- What problem this project solves (use real-world analogies if helpful)
- What technologies it uses (explain acronyms)
- How someone might use or learn from this project
Avoid jargon. Keep it to 3-4 short paragraphs.`,

  technical: `You are a senior software architect. Given repository metadata, provide a detailed technical explanation covering:
1. What the project does and its core purpose
2. Key architectural decisions and patterns (mention specific patterns if detected)
3. Main technologies and frameworks (reference versions if available)
4. How the codebase is organized (entry points, key files)
5. Notable implementation details (testing, CI/CD, containerization)
Be specific and technical. 4-6 paragraphs. Reference actual file names and dependencies when relevant.`,

  architect: `You are a software architect reviewing a codebase. Given repository metadata, analyze:
1. Architectural patterns employed (monorepo, microservices, layered, etc.)
2. Technology choices and their trade-offs
3. Code organization and module boundaries
4. DevOps maturity (CI/CD, containerization, testing)
5. Scalability considerations and potential limitations
6. What makes this architecture notable or unusual
Be specific about design decisions. 4-6 paragraphs.`,

  question: `You are a helpful senior developer. Answer the user's question about the repository using ONLY the provided metadata. Be direct and practical. If the metadata doesn't contain enough information to answer confidently, say so rather than speculating. Do not reference specific files or patterns unless they appear in the provided context.`,
}

const VALID_MODES = ['quick', 'beginner', 'technical', 'architect', 'question', 'readme']

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

const GROQ_TIMEOUT_MS = 12000 // 12 seconds

async function callGroq(
  systemPrompt: string,
  userPrompt: string,
  model: string
): Promise<string> {
  const apiKey = Deno.env.get('GROQ_API_KEY')
  if (!apiKey) throw new Error('GROQ_API_KEY not configured')

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS)

  try {
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
      signal: controller.signal,
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      // Log full error server-side only
      console.error('Groq API error:', response.status, err)
      // Return sanitized error to client
      throw new Error(`AI service error (${response.status})`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content || content.trim().length === 0) {
      throw new Error('Empty response from AI model')
    }

    return content
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('AI request timed out')
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
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

    // Validate mode and log if falling back
    if (!VALID_MODES.includes(mode)) {
      console.warn(`Unknown mode "${mode}", falling back to quick`)
    }
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
