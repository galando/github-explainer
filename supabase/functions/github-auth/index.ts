const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Use environment variable so this works on any Supabase project
const FUNCTION_URL = `${Deno.env.get('SUPABASE_URL')}/functions/v1/github-auth`

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const GITHUB_CLIENT_ID = Deno.env.get('GITHUB_CLIENT_ID')
  const GITHUB_CLIENT_SECRET = Deno.env.get('GITHUB_CLIENT_SECRET')

  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    return new Response(
      JSON.stringify({ error: 'GitHub OAuth not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const url = new URL(req.url)
  const action = url.searchParams.get('action')

  // Step 1: Redirect to GitHub OAuth
  if (action === 'login') {
    const redirectUri = url.searchParams.get('redirect_uri') || 'https://example.com'
    const state = encodeURIComponent(redirectUri)

    const githubAuthUrl = new URL('https://github.com/login/oauth/authorize')
    githubAuthUrl.searchParams.set('client_id', GITHUB_CLIENT_ID)
    githubAuthUrl.searchParams.set('redirect_uri', FUNCTION_URL)
    githubAuthUrl.searchParams.set('scope', 'read:user user:email public_repo')
    githubAuthUrl.searchParams.set('state', state)

    return new Response(null, {
      status: 302,
      headers: { 'Location': githubAuthUrl.toString() },
    })
  }

  // Step 2: Handle callback from GitHub (code + state present)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')

  if (code) {
    const appRedirectUri = state ? decodeURIComponent(state) : '/'

    try {
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          code,
        }),
      })

      const tokenData = await tokenResponse.json()

      if (tokenData.error) {
        throw new Error(tokenData.error_description || tokenData.error)
      }

      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      })

      const userData = await userResponse.json()

      const finalRedirect = new URL(appRedirectUri)
      finalRedirect.hash = `access_token=${tokenData.access_token}&user=${encodeURIComponent(
        JSON.stringify({
          id: userData.id,
          login: userData.login,
          name: userData.name,
          avatar_url: userData.avatar_url,
          email: userData.email,
        })
      )}`

      return new Response(null, {
        status: 302,
        headers: { 'Location': finalRedirect.toString() },
      })
    } catch (error) {
      const errorRedirect = new URL(appRedirectUri)
      errorRedirect.hash = `error=${encodeURIComponent((error as Error).message)}`
      return new Response(null, {
        status: 302,
        headers: { 'Location': errorRedirect.toString() },
      })
    }
  }

  return new Response(
    JSON.stringify({ error: 'Invalid request. Use ?action=login to start OAuth flow.' }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
