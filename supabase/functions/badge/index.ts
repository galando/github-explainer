import { createClient } from 'jsr:@supabase/supabase-js@2'

const BADGE_SVG = (repoName: string) => `
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="20">
  <defs>
    <linearGradient id="bg" x2="0" y2="100%">
      <stop offset="0" stop-color="#555"/>
      <stop offset="1" stop-color="#333"/>
    </linearGradient>
    <linearGradient id="accent" x2="0" y2="100%">
      <stop offset="0" stop-color="#58a6ff"/>
      <stop offset="1" stop-color="#1f6feb"/>
    </linearGradient>
  </defs>
  <clipPath id="r"><rect width="200" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="90" height="20" fill="url(#bg)"/>
    <rect x="90" width="110" height="20" fill="url(#accent)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="45" y="14">Explained on</text>
    <text x="145" y="14" font-weight="bold">GitHub Explainer</text>
  </g>
</svg>`.trim()

Deno.serve(async (req: Request) => {
  const url = new URL(req.url)
  const pathParts = url.pathname.split('/').filter(Boolean)

  // Expected path: /badge/{owner}/{repo} (function mounted at /badge)
  const owner = pathParts[0] || url.searchParams.get('owner')
  const repo = pathParts[1] || url.searchParams.get('repo')

  if (!owner || !repo) {
    return new Response(BADGE_SVG('unknown'), {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache',
      },
    })
  }

  const repoFullName = `${owner}/${repo}`

  // Log badge view in background (fire and forget)
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const referrer = req.headers.get('referer') || req.headers.get('referrer') || null
    const userAgent = req.headers.get('user-agent') || null

    EdgeRuntime.waitUntil(
      supabase.from('badge_views').insert({
        repo_full_name: repoFullName,
        referrer,
        user_agent: userAgent,
      })
    )
  } catch (e) {
    console.error('Failed to log badge view:', e)
  }

  return new Response(BADGE_SVG(repoFullName), {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  })
})
