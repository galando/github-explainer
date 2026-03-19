import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { TrendingUp, Filter, Star, GitFork } from 'lucide-react'
import { SEOHead } from '@/components/repo/SEOHead'
import { githubService, GitHubRepo, getLanguageColor } from '@/services/github'
import { trackPageView } from '@/lib/analytics'

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly'

const PERIOD_LABELS: Record<Period, string> = {
  daily: 'Today',
  weekly: 'This Week',
  monthly: 'This Month',
  yearly: 'This Year',
}

const LANGUAGES = [
  '', 'TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'Java', 'C++', 'C', 'C#',
  'Kotlin', 'Swift', 'PHP', 'Ruby', 'Scala', 'Shell', 'Dart', 'Elixir',
]

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

export default function Trending() {
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState<Period>('weekly')
  const [language, setLanguage] = useState('')

  useEffect(() => {
    trackPageView('/trending')
  }, [])

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setRepos([])

    const since: 'daily' | 'weekly' | 'monthly' = period === 'yearly' ? 'monthly' : period

    githubService
      .getTrendingRepos(language || undefined, since)
      .then(data => { if (!cancelled) { setRepos(data); setIsLoading(false) } })
      .catch(() => { if (!cancelled) setIsLoading(false) })

    return () => { cancelled = true }
  }, [period, language])

  return (
    <>
      <SEOHead
        title="Trending GitHub Repositories This Week"
        description="Explore trending GitHub repositories and understand them instantly with AI."
      />
      {/* Hero section */}
      <div className="border-b border-[--color-border-default] bg-[--color-background]">
        <div className="container mx-auto px-4 py-10">
          <div className="flex items-center gap-4 mb-6">
            <TrendingUp className="w-10 h-10 text-[--color-text-muted]" />
            <div>
              <h1 className="text-3xl font-bold text-[--color-text-primary]">Trending Repositories</h1>
              <p className="text-[--color-text-secondary] mt-1">Discover the hottest new projects on GitHub</p>
            </div>
          </div>

          {/* Period tabs */}
          <div className="flex gap-6 border-b border-[--color-border-default]">
            {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`pb-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  period === p
                    ? 'border-[--color-accent-blue] text-[--color-text-primary]'
                    : 'border-transparent text-[--color-text-secondary] hover:text-[--color-text-primary]'
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        {/* Language filter */}
        <div className="flex items-center gap-2 mb-6">
          <Filter className="w-4 h-4 text-[--color-text-muted]" />
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            className="px-3 py-1.5 text-sm border border-[--color-border-default] rounded-lg bg-[--color-background-secondary] text-[--color-text-secondary] focus:outline-none"
          >
            {LANGUAGES.map(l => (
              <option key={l} value={l}>{l || 'All Languages'}</option>
            ))}
          </select>
        </div>

        {/* Numbered list */}
        <div className="space-y-2">
          {isLoading
            ? Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-24 bg-[--color-background-secondary] rounded-xl animate-pulse" />
              ))
            : repos.map((repo, idx) => (
                <Link
                  key={repo.id}
                  to={`/repo/${repo.full_name}`}
                  className="flex items-start gap-4 p-5 bg-[--color-background-secondary] rounded-xl border border-[--color-border-default] hover:border-[--color-accent-blue] transition-colors"
                >
                  {/* Rank number */}
                  <span className="text-lg font-semibold text-[--color-text-muted] w-6 shrink-0 pt-0.5">
                    {idx + 1}
                  </span>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[--color-text-primary] text-base leading-snug">
                      {repo.full_name}
                    </p>
                    {repo.description && (
                      <p className="text-sm text-[--color-text-secondary] mt-1 line-clamp-2">
                        {repo.description}
                      </p>
                    )}
                    {/* Topics */}
                    {repo.topics && repo.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {repo.topics.slice(0, 4).map(topic => (
                          <span
                            key={topic}
                            className="px-2 py-0.5 text-xs rounded-full bg-[--color-background] border border-[--color-border-default] text-[--color-text-secondary]"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Stats row */}
                    <div className="flex items-center gap-4 mt-2 text-xs text-[--color-text-muted]">
                      {repo.language && (
                        <span className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: getLanguageColor(repo.language) }}
                          />
                          {repo.language}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5" />
                        {formatNum(repo.stargazers_count)}
                      </span>
                      <span className="flex items-center gap-1">
                        <GitFork className="w-3.5 h-3.5" />
                        {formatNum(repo.forks_count)}
                      </span>
                    </div>
                  </div>

                  {/* Stars gained indicator (shows total stars as proxy) */}
                  <div className="shrink-0 flex items-center gap-1 text-sm font-medium text-[--color-accent-green]">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {formatNum(repo.stargazers_count)}
                  </div>
                </Link>
              ))
          }
        </div>
      </main>
    </>
  )
}
