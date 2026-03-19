const GITHUB_API = 'https://api.github.com'

// ─── Server-side proxy ───────────────────────────────────────────────────────
// When VITE_SUPABASE_URL is set we route every GitHub API call through the
// github-proxy Edge Function.  That function injects a server-side GITHUB_TOKEN
// secret (5 000 req/hr) so every visitor shares the authenticated quota instead
// of being subject to the anonymous 60 req/hr per-IP limit.
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? ''
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? ''
const USE_PROXY = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

// Converts a GitHub API path ("/repos/owner/repo") into the correct fetch URL.
function apiUrl(path: string): string {
  if (USE_PROXY) {
    return `${SUPABASE_URL}/functions/v1/github-proxy?path=${encodeURIComponent(path)}`
  }
  return `${GITHUB_API}${path}`
}

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  homepage: string | null
  stargazers_count: number
  forks_count: number
  watchers_count: number
  open_issues_count: number
  language: string | null
  topics: string[]
  license: { name: string; spdx_id: string } | null
  owner: { login: string; avatar_url: string }
  default_branch: string
  created_at: string
  updated_at: string
  pushed_at: string
  size: number
  archived: boolean
  fork: boolean
  visibility: string
  subscribers_count: number
}

export interface GitHubTreeItem {
  path: string
  type: 'blob' | 'tree'
  size?: number
  sha: string
}

export interface GitHubContent {
  name: string
  path: string
  type: 'file' | 'dir'
  content?: string
  encoding?: string
  download_url: string | null
  sha: string
  size: number
}

export interface GitHubContributor {
  login: string
  avatar_url: string
  html_url: string
  contributions: number
}

export interface GitHubCommit {
  sha: string
  commit: {
    message: string
    author: { name: string; date: string }
  }
  author: { login: string; avatar_url: string } | null
}

export interface GitHubSearchResult {
  total_count: number
  items: GitHubRepo[]
}

// Language color mapping (subset of github-colors)
export const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript:  '#3178c6',
  JavaScript:  '#f1e05a',
  Python:      '#3572A5',
  Java:        '#b07219',
  Go:          '#00ADD8',
  Rust:        '#dea584',
  C:           '#555555',
  'C++':       '#f34b7d',
  'C#':        '#178600',
  Ruby:        '#701516',
  PHP:         '#4F5D95',
  Swift:       '#F05138',
  Kotlin:      '#A97BFF',
  Scala:       '#c22d40',
  Elixir:      '#6e4a7e',
  Haskell:     '#5e5086',
  Clojure:     '#db5855',
  Vue:         '#41b883',
  CSS:         '#563d7c',
  HTML:        '#e34c26',
  Shell:       '#89e051',
  Dockerfile:  '#384d54',
  Dart:        '#00B4AB',
  Lua:         '#000080',
  R:           '#198CE7',
  MATLAB:      '#e16737',
  Perl:        '#0298c3',
  Groovy:      '#4298b8',
  Julia:       '#a270ba',
  Nix:         '#7e7eff',
  Zig:         '#ec915c',
  Vim:         '#199f4b',
}

class GitHubService {
  private userToken: string | null = null

  setUserToken(token: string | null) {
    this.userToken = token
  }

  private get headers(): Record<string, string> {
    const h: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    }
    if (USE_PROXY) {
      // Supabase Edge Functions require the anon key in Authorization.
      // The proxy will replace this with the server GITHUB_TOKEN when calling GitHub.
      h['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`
      h['apikey'] = SUPABASE_ANON_KEY
      if (this.userToken) {
        // The proxy reads x-github-token and uses it instead of the server token,
        // so signed-in users still get their own 5 000 req/hr quota on top.
        h['x-github-token'] = this.userToken
      }
    } else {
      // Direct GitHub API — only works for 60 req/hr unless the user is signed in.
      if (this.userToken) {
        h['Authorization'] = `Bearer ${this.userToken}`
      }
    }
    return h
  }

  private async fetch<T>(url: string, timeoutMs = 15_000): Promise<T> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(url, { headers: this.headers, signal: controller.signal })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.message ?? `GitHub API error: ${res.status}`)
      }
      return res.json() as Promise<T>
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        throw new Error('Request timed out. You may have hit the GitHub rate limit — sign in for higher limits.')
      }
      throw err
    } finally {
      clearTimeout(timer)
    }
  }

  async getRepo(owner: string, repo: string): Promise<GitHubRepo> {
    return this.fetch<GitHubRepo>(apiUrl(`/repos/${owner}/${repo}`))
  }

  async getRepoTree(owner: string, repo: string, branch = 'HEAD'): Promise<GitHubTreeItem[]> {
    const data = await this.fetch<{ tree: GitHubTreeItem[]; truncated: boolean }>(
      apiUrl(`/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`)
    )
    return data.tree
  }

  async getLanguages(owner: string, repo: string): Promise<Record<string, number>> {
    return this.fetch<Record<string, number>>(apiUrl(`/repos/${owner}/${repo}/languages`))
  }

  async getContributors(owner: string, repo: string, perPage = 30): Promise<GitHubContributor[]> {
    return this.fetch<GitHubContributor[]>(
      apiUrl(`/repos/${owner}/${repo}/contributors?per_page=${perPage}`)
    )
  }

  async getCommits(owner: string, repo: string, perPage = 10): Promise<GitHubCommit[]> {
    return this.fetch<GitHubCommit[]>(
      apiUrl(`/repos/${owner}/${repo}/commits?per_page=${perPage}`)
    )
  }

  async getReadme(owner: string, repo: string): Promise<string | null> {
    try {
      const data = await this.fetch<{ content: string; encoding: string }>(
        apiUrl(`/repos/${owner}/${repo}/readme`)
      )
      if (data.encoding === 'base64') {
        return atob(data.content.replace(/\n/g, ''))
      }
      return data.content
    } catch {
      return null
    }
  }

  async getFileContent(owner: string, repo: string, path: string): Promise<string | null> {
    try {
      const data = await this.fetch<GitHubContent>(
        apiUrl(`/repos/${owner}/${repo}/contents/${path}`)
      )
      if (data.content && data.encoding === 'base64') {
        return atob(data.content.replace(/\n/g, ''))
      }
      return null
    } catch {
      return null
    }
  }

  async searchRepos(query: string, sort: 'stars' | 'forks' | 'updated' = 'stars', perPage = 10): Promise<GitHubRepo[]> {
    const data = await this.fetch<GitHubSearchResult>(
      apiUrl(`/search/repositories?q=${encodeURIComponent(query)}&sort=${sort}&per_page=${perPage}`)
    )
    return data.items
  }

  async getTrendingRepos(language?: string, since: 'daily' | 'weekly' | 'monthly' = 'weekly'): Promise<GitHubRepo[]> {
    const days = since === 'daily' ? 1 : since === 'weekly' ? 7 : 30
    const date = new Date()
    date.setDate(date.getDate() - days)
    const dateStr = date.toISOString().split('T')[0]

    let q = `created:>${dateStr} stars:>10`
    if (language) q += ` language:${language}`

    const data = await this.fetch<GitHubSearchResult>(
      apiUrl(`/search/repositories?q=${encodeURIComponent(q)}&sort=stars&per_page=20`)
    )
    return data.items
  }

  async getCommitActivity(owner: string, repo: string): Promise<WeeklyCommitStat[] | null> {
    // Use raw fetch — the GitHub stats API returns 202 (empty body) while computing,
    // which breaks the shared fetch() that always calls res.json().
    try {
      const res = await fetch(
        apiUrl(`/repos/${owner}/${repo}/stats/commit_activity`),
        { headers: this.headers }
      )
      if (res.status === 202 || res.status === 204) return null  // still computing / empty repo
      if (!res.ok) return null
      const data = await res.json()
      return Array.isArray(data) && data.length > 0 ? data : null
    } catch {
      return null
    }
  }
}

export const githubService = new GitHubService()

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

export function getLanguageColor(language: string | null): string {
  if (!language) return '#8b949e'
  return LANGUAGE_COLORS[language] ?? '#8b949e'
}

export interface WeeklyCommitStat {
  week: number   // Unix timestamp (start of week)
  total: number
  days: number[] // 7 values, Sun-Sat
}
