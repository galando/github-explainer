import { useEffect } from 'react'

/**
 * OAuth callback page. Supabase redirects here after GitHub login.
 * We parse the access_token from the URL hash and pass it back to
 * the opener window via postMessage, then close this popup.
 */
export default function AuthCallback() {
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    const params = new URLSearchParams(hash)
    const access_token = params.get('access_token')
    const error = params.get('error')

    if (error) {
      if (window.opener) {
        window.opener.postMessage({ type: 'github-oauth-error', error }, window.location.origin)
        window.close()
      } else {
        window.location.href = '/'
      }
      return
    }

    if (access_token && window.opener) {
      // Fetch GitHub user to include in the message
      fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${access_token}` },
      })
        .then(r => r.json())
        .then(user => {
          window.opener.postMessage(
            { type: 'github-oauth-success', access_token, user },
            window.location.origin
          )
          window.close()
        })
        .catch(() => {
          window.opener.postMessage(
            { type: 'github-oauth-success', access_token, user: null },
            window.location.origin
          )
          window.close()
        })
    } else if (!window.opener) {
      // No popup context — redirect to home
      window.location.href = '/'
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-spin">⟳</div>
        <p className="text-[--color-text-secondary]">Completing sign in...</p>
      </div>
    </div>
  )
}
