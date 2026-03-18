import { useState, useEffect } from 'react'
import { githubService, GitHubRepo, GitHubTreeItem, GitHubContributor, GitHubCommit, WeeklyCommitStat } from '@/services/github'

export interface RepoData {
  repo: GitHubRepo
  tree: GitHubTreeItem[]
  languages: Record<string, number>
  contributors: GitHubContributor[]
  commits: GitHubCommit[]
  readme: string | null
  commitActivity: WeeklyCommitStat[] | null
}

interface UseGitHubRepoResult {
  data: RepoData | null
  isLoading: boolean
  error: string | null
}

const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

function cacheKey(owner: string, repoName: string): string {
  return `gh_repo_${owner}/${repoName}`
}

function readCache(owner: string, repoName: string): RepoData | null {
  try {
    const raw = localStorage.getItem(cacheKey(owner, repoName))
    if (!raw) return null
    const { data, ts } = JSON.parse(raw) as { data: RepoData; ts: number }
    if (Date.now() - ts > CACHE_TTL_MS) {
      localStorage.removeItem(cacheKey(owner, repoName))
      return null
    }
    // Backward-compat: old cached entries may lack commitActivity
    if (!('commitActivity' in data)) data.commitActivity = null
    return data
  } catch {
    return null
  }
}

function writeCache(owner: string, repoName: string, data: RepoData): void {
  try {
    localStorage.setItem(cacheKey(owner, repoName), JSON.stringify({ data, ts: Date.now() }))
  } catch {
    // localStorage quota exceeded or unavailable — ignore
  }
}

export function useGitHubRepo(owner: string, repoName: string): UseGitHubRepoResult {
  const [data, setData] = useState<RepoData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!owner || !repoName) return

    let cancelled = false

    // Serve from cache immediately while fetching fresh data
    const cached = readCache(owner, repoName)
    if (cached) {
      setData(cached)
      setIsLoading(false)
      return
    }

    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const [repo, tree, languages, contributors, commits, readme, commitActivity] = await Promise.allSettled([
          githubService.getRepo(owner, repoName),
          githubService.getRepoTree(owner, repoName),
          githubService.getLanguages(owner, repoName),
          githubService.getContributors(owner, repoName, 30),
          githubService.getCommits(owner, repoName, 10),
          githubService.getReadme(owner, repoName),
          githubService.getCommitActivity(owner, repoName),
        ])

        if (cancelled) return

        if (repo.status === 'rejected') {
          const msg = (repo.reason as Error)?.message ?? ''
          if (msg.toLowerCase().includes('rate limit') || msg.includes('403')) {
            throw new Error('GitHub API rate limit reached. Sign in with GitHub for higher limits.')
          }
          throw new Error(`Repository not found: ${owner}/${repoName}`)
        }

        const result: RepoData = {
          repo: repo.value,
          tree: tree.status === 'fulfilled' ? tree.value : [],
          languages: languages.status === 'fulfilled' ? languages.value : {},
          contributors: contributors.status === 'fulfilled' ? contributors.value : [],
          commits: commits.status === 'fulfilled' ? commits.value : [],
          readme: readme.status === 'fulfilled' ? readme.value : null,
          commitActivity: commitActivity.status === 'fulfilled' ? commitActivity.value : null,
        }

        setData(result)
        writeCache(owner, repoName, result)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load repository')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchData()

    return () => { cancelled = true }
  }, [owner, repoName])

  return { data, isLoading, error }
}
