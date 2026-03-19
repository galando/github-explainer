import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/integrations/supabase/client'

export interface GitHubUser {
  id: number
  login: string
  name: string | null
  email: string | null
  avatar_url: string
  html_url: string
  public_repos: number
  followers: number
  following: number
}

interface AuthContextValue {
  user: GitHubUser | null
  gitHubToken: string | null
  isLoading: boolean
  loading: boolean
  signIn: () => Promise<void>
  signInWithGitHub: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GitHubUser | null>(null)
  const [gitHubToken, setGitHubToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.provider_token) {
          setGitHubToken(session.provider_token)
          await fetchGitHubUser(session.provider_token)
        }
      } catch (err) {
        console.error('Failed to get session:', err)
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()

    // Listen for OAuth popup message
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'github-oauth-success') {
        const { access_token, user: userData } = event.data
        if (access_token) {
          setGitHubToken(access_token)
          if (userData) {
            setUser(userData)
          } else {
            fetchGitHubUser(access_token)
          }
        }
      }
    }

    window.addEventListener('message', handleMessage)

    // Also listen for Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.provider_token) {
        setGitHubToken(session.provider_token)
        await fetchGitHubUser(session.provider_token)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setGitHubToken(null)
      }
    })

    return () => {
      window.removeEventListener('message', handleMessage)
      subscription.unsubscribe()
    }
  }, [])

  const fetchGitHubUser = async (token: string) => {
    try {
      const res = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const userData: GitHubUser = await res.json()
        setUser(userData)
      }
    } catch (err) {
      console.error('Failed to fetch GitHub user:', err)
    }
  }

  const signIn = async () => {
    const redirectTo = `${window.location.origin}/auth/callback`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo,
        scopes: 'read:user user:email public_repo',
        skipBrowserRedirect: true,
      },
    })
    if (error) throw error

    // Open OAuth in popup
    const { data } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo,
        scopes: 'read:user user:email public_repo',
      },
    })

    if (data?.url) {
      const popup = window.open(
        data.url,
        'github-oauth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      )
      if (!popup) {
        // Fallback: redirect in same tab
        window.location.href = data.url
      }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setGitHubToken(null)
  }

  return (
    <AuthContext.Provider value={{ user, gitHubToken, isLoading, loading: isLoading, signIn, signInWithGitHub: signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
