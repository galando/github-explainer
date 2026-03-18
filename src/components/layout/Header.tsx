import { Link } from 'react-router'
import { Github, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import Logo from '@/components/ui/Logo'

function Header() {
  const { user, loading, signInWithGitHub, signOut } = useAuth()

  return (
    <header className="sticky top-0 z-50 bg-[--color-background]/80 backdrop-blur-md border-b border-[--color-border-default]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Logo className="w-8 h-8" />
            <span className="font-bold text-[--color-text-primary]">GitHub Explainer</span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <Link
              to="/trending"
              className="text-sm text-[--color-text-secondary] hover:text-[--color-text-primary] transition-colors"
            >
              Trending
            </Link>

            {!loading && !user && (
              <div className="relative group">
                <button
                  onClick={signInWithGitHub}
                  className="flex items-center gap-2 px-4 py-2 bg-[--color-text-primary] text-[--color-background] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <Github className="w-4 h-4" />
                  Sign in
                </button>
                {/* Tooltip */}
                <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-[--color-background-secondary] border border-[--color-border-default] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <p className="text-sm text-[--color-text-primary] font-medium mb-1">Optional sign in</p>
                  <p className="text-xs text-[--color-text-muted]">
                    Sign in with GitHub for higher API limits (5,000 vs 60 requests/hour). All features work without signing in.
                  </p>
                </div>
              </div>
            )}

            {!loading && user && (
              <div className="flex items-center gap-3">
                <img
                  src={user.avatar_url}
                  alt={user.login}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm text-[--color-text-secondary] hidden sm:block">
                  {user.login}
                </span>
                <button
                  onClick={signOut}
                  className="p-2 text-[--color-text-muted] hover:text-[--color-text-primary] transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export { Header }
export default Header
