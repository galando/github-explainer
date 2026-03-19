/**
 * @module github-proxy
 * Proxies GitHub API requests server-side to improve rate limits and add CORS headers.
 * Usage: GET /github-proxy?path=/repos/owner/repo
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-github-token, x-github-api-version',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

const GITHUB_API = 'https://api.github.com'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const url = new URL(req.url)
  const path = url.searchParams.get('path')

  if (!path) {
    return new Response(JSON.stringify({ error: 'Missing required query param: path' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const githubUrl = `${GITHUB_API}${path}`

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'github-explainer-proxy',
  }

  // Use server-side GitHub token if available (higher rate limits)
  const serverToken = Deno.env.get('GITHUB_TOKEN')
  if (serverToken) {
    headers.Authorization = `Bearer ${serverToken}`
  }

  // Also accept a user-provided token forwarded in the request
  const authHeader = req.headers.get('x-github-token')
  if (authHeader) {
    headers.Authorization = `Bearer ${authHeader}`
  }

  try {
    const response = await fetch(githubUrl, { headers })

    const body = await response.text()

    return new Response(body, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        'X-RateLimit-Remaining': response.headers.get('X-RateLimit-Remaining') || '',
        'X-RateLimit-Reset': response.headers.get('X-RateLimit-Reset') || '',
      },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
