import { useParams } from 'react-router'
import { useState, useEffect } from 'react'
import { SEOHead } from '@/components/repo/SEOHead'
import { githubService, GitHubRepo } from '@/services/github'

function formatNum(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

const CATEGORY_QUERIES: Record<string, string> = {
  frontend:     'topic:frontend stars:>500',
  backend:      'topic:backend stars:>500',
  mobile:       'topic:mobile stars:>500',
  devtools:     'topic:developer-tools stars:>500',
  ai:           'topic:machine-learning stars:>1000',
  database:     'topic:database stars:>500',
  security:     'topic:security stars:>500',
  gamedev:      'topic:game-development stars:>500',
}

export default function Category() {
  const { category } = useParams<{ category: string }>()
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!category) return
    let cancelled = false
    setIsLoading(true)

    const query = CATEGORY_QUERIES[category] ?? `topic:${category} stars:>100`
    githubService
      .searchRepos(query, 20)
      .then(data => { if (!cancelled) { setRepos(data); setIsLoading(false) } })
      .catch(() => { if (!cancelled) setIsLoading(false) })

    return () => { cancelled = true }
  }, [category])

  return (
    <>
      <SEOHead
        title={`${category} Repositories — GitHub Explainer`}
        description={`Explore popular ${category} repositories explained with AI.`}
      />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-[--color-text-primary] mb-2 capitalize">{category}</h1>
        <p className="text-[--color-text-secondary] mb-8">Popular repositories in this category</p>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-36 bg-[--color-background-secondary] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {repos.map(repo => (
              <a
                key={repo.id}
                href={`/repo/${repo.full_name}`}
                className="p-5 bg-[--color-background-secondary] rounded-xl border border-[--color-border-default] hover:border-[--color-accent-blue] hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <img src={repo.owner.avatar_url} alt={repo.owner.login} className="w-5 h-5 rounded-full" />
                  <span className="text-xs text-[--color-text-muted]">{repo.owner.login}</span>
                </div>
                <p className="font-semibold text-[--color-text-primary] mb-1">{repo.name}</p>
                {repo.description && (
                  <p className="text-xs text-[--color-text-secondary] line-clamp-2 mb-3">{repo.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-[--color-text-muted]">
                  <span>⭐ {formatNum(repo.stargazers_count)}</span>
                  <span>🍴 {formatNum(repo.forks_count)}</span>
                  {repo.language && <span>• {repo.language}</span>}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
