import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { Star, GitFork, Clock, Calendar, Loader2 } from 'lucide-react'
import { githubService, GitHubRepo, formatNumber, getLanguageColor } from '@/services/github'

type Tab = 'alltime' | 'week'

export default function TrendingRepos() {
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('alltime')

  useEffect(() => {
    const fetchRepos = async () => {
      setLoading(true)
      try {
        let data: GitHubRepo[]

        if (activeTab === 'alltime') {
          // All-time most starred repos
          data = await githubService.searchRepos('stars:>100000', 'stars', 9)
        } else {
          // Trending this week
          const oneWeekAgo = new Date()
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
          const dateStr = oneWeekAgo.toISOString().split('T')[0]
          data = await githubService.searchRepos(
            `created:>${dateStr} stars:>100`,
            'stars',
            6
          )
        }

        setRepos(data)
      } catch (error) {
        console.error('Failed to fetch repos:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRepos()
  }, [activeTab])

  return (
    <section className="px-4 pb-20 max-w-6xl mx-auto w-full">
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[--color-text-primary]">Popular Projects</h2>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[--color-background-secondary] border border-[--color-border-default]">
          <button
            onClick={() => setActiveTab('alltime')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all"
            style={activeTab === 'alltime'
              ? { backgroundColor: 'var(--color-accent-blue)', color: '#fff' }
              : { color: 'var(--color-text-secondary)' }}
          >
            <Calendar className="w-3.5 h-3.5" />
            All Time
          </button>
          <button
            onClick={() => setActiveTab('week')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all"
            style={activeTab === 'week'
              ? { backgroundColor: 'var(--color-accent-blue)', color: '#fff' }
              : { color: 'var(--color-text-secondary)' }}
          >
            <Clock className="w-3.5 h-3.5" />
            This Week
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-[--color-text-muted]" />
        </div>
      )}

      {/* Repo grid */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {repos.map(repo => (
            <Link
              key={repo.full_name}
              to={`/repo/${repo.owner.login}/${repo.name}`}
              className="group flex flex-col gap-3 p-4 rounded-xl border border-[--color-border-default] bg-[--color-background-secondary] hover:border-[--color-accent-blue] transition-colors"
            >
              {/* Owner row */}
              <div className="flex items-center gap-2">
                <img
                  src={repo.owner.avatar_url}
                  alt={repo.owner.login}
                  className="w-6 h-6 rounded-full"
                />
                <span className="text-xs text-[--color-text-muted]">{repo.owner.login}</span>
              </div>

              {/* Repo name */}
              <div>
                <p className="font-semibold text-[--color-text-primary] group-hover:text-[--color-accent-blue] transition-colors text-sm leading-snug">
                  {repo.name}
                </p>
                {repo.description && (
                  <p className="text-xs text-[--color-text-secondary] mt-1 line-clamp-2 leading-relaxed">
                    {repo.description}
                  </p>
                )}
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-3 mt-auto">
                {repo.language && (
                  <span className="flex items-center gap-1.5 text-xs text-[--color-text-secondary]">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: getLanguageColor(repo.language) }}
                    />
                    {repo.language}
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs text-[--color-text-muted]">
                  <Star className="w-3.5 h-3.5" />
                  {formatNumber(repo.stargazers_count)}
                </span>
                <span className="flex items-center gap-1 text-xs text-[--color-text-muted]">
                  <GitFork className="w-3.5 h-3.5" />
                  {formatNumber(repo.forks_count)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
