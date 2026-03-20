import { useState, useEffect, useRef, useMemo } from 'react'
import { marked } from 'marked'
import { supabase } from '@/integrations/supabase/client'
import { RepoData } from '@/hooks/useGitHubRepo'
import { RepoAnalysis } from '@/services/repoAnalyzer'
import { trackExplanationRequested, trackBadgeCopied } from '@/lib/analytics'

// Configure marked once
marked.setOptions({ breaks: true, gfm: true })

export type ExplanationMode = 'quick' | 'beginner' | 'technical' | 'architect' | 'readme'

const MODES: { id: ExplanationMode; label: string; icon: string }[] = [
  { id: 'quick',     label: 'Quick Summary', icon: '⚡' },
  { id: 'beginner',  label: 'Beginner',      icon: '🌱' },
  { id: 'technical', label: 'Senior Dev',    icon: '💻' },
  { id: 'architect', label: 'Deep Dive',     icon: '🏗' },
  { id: 'readme',    label: 'README',        icon: '📄' },
]

function buildContext(repoData: RepoData, analysis: RepoAnalysis): string {
  const { repo, tree, languages, contributors, commits } = repoData
  const langList = Object.entries(languages)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([l]) => l)
    .join(', ')

  // Enhanced tech stack with categories
  const frameworks = analysis.techStack
    .filter(t => t.category === 'framework' && t.confidence !== 'low')
    .map(t => t.name)
    .slice(0, 6)
  const tools = analysis.techStack
    .filter(t => (t.category === 'tool' || t.category === 'library') && t.confidence !== 'low')
    .map(t => t.name)
    .slice(0, 6)

  const archList = analysis.architecture.map(a => a.name).join(', ')
  const fileCount = tree.filter(f => f.type === 'blob').length
  const topFiles = analysis.keyFiles.slice(0, 8).map(f => f.path).join(', ')
  const recentCommits = commits
    .slice(0, 5)
    .map(c => c.commit.message.split('\n')[0])
    .join('; ')

  // Build dependency context with versions
  let depContext = ''
  if (analysis.dependencies && analysis.dependencies.production.length > 0) {
    // First try to get framework/core deps
    let filteredDeps = analysis.dependencies.production
      .filter(d => d.category === 'framework' || d.category === 'core')

    // Fallback to top deps if filter was too restrictive
    if (filteredDeps.length === 0) {
      filteredDeps = analysis.dependencies.production.slice(0, 5)
    }

    const topDeps = filteredDeps
      .slice(0, 8)
      .map(d => d.version ? `${d.name}@${d.version}` : d.name)
      .join(', ')

    if (topDeps) {
      depContext = `\nMain dependencies: ${topDeps}`
      if (analysis.dependencies.total > 8) {
        depContext += ` (and ${analysis.dependencies.total - 8} more)`
      }
    }
  }

  // Build scripts context
  let scriptContext = ''
  if (analysis.scripts && Object.keys(analysis.scripts).length > 0) {
    const scriptList = Object.entries(analysis.scripts)
      .slice(0, 5)
      .map(([k, v]) => `${k}: ${v.slice(0, 50)}${v.length > 50 ? '...' : ''}`)
      .join('; ')
    scriptContext = `\nNPM scripts: ${scriptList}`
  }

  // CI/CD context
  let cicdContext = ''
  if (analysis.cicd.length > 0) {
    cicdContext = `\nCI/CD: ${analysis.cicd.join(', ')}`
  }

  // Testing context
  let testingContext = ''
  if (analysis.testingFrameworks.length > 0) {
    testingContext = `\nTesting: ${analysis.testingFrameworks.join(', ')}`
  }

  // Package manager
  let pmContext = ''
  if (analysis.packageManager) {
    pmContext = `\nPackage manager: ${analysis.packageManager}`
  }

  // Check for Docker
  const hasDocker = tree.some(f =>
    f.path === 'Dockerfile' ||
    f.path === 'docker-compose.yml' ||
    f.path === 'docker-compose.yaml'
  )

  // Activity summary
  let activityContext = ''
  if (commits.length > 0) {
    const lastCommitDate = new Date(commits[0].commit.author.date)
    const daysSinceLastCommit = Math.floor((Date.now() - lastCommitDate.getTime()) / (1000 * 60 * 60 * 24))
    if (daysSinceLastCommit < 7) {
      activityContext = `\nRecent activity: ${commits.length} commits in last check, last commit ${daysSinceLastCommit === 0 ? 'today' : `${daysSinceLastCommit} days ago`}`
    } else if (daysSinceLastCommit < 30) {
      activityContext = `\nRecent activity: last commit ${daysSinceLastCommit} days ago`
    }
  }

  return `
Repository: ${repo.full_name}
Description: ${repo.description ?? 'No description'}
Stars: ${repo.stargazers_count.toLocaleString()} | Forks: ${repo.forks_count.toLocaleString()} | Issues: ${repo.open_issues_count.toLocaleString()}
Primary Language: ${repo.language ?? 'Unknown'}${langList !== repo.language ? ` | All languages: ${langList}` : ''}
${frameworks.length > 0 ? `Frameworks: ${frameworks.join(', ')}` : ''}
${tools.length > 0 ? `Tools & Libraries: ${tools.join(', ')}` : ''}
Architecture: ${archList || 'Standard project structure'}
File count: ${fileCount}
Key files: ${topFiles}
Contributors: ${contributors.length}${pmContext}${cicdContext}${testingContext}${hasDocker ? '\nDocker: Yes' : ''}${activityContext}${depContext}${scriptContext}
`.trim()
}

function timeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000)
  if (secs < 60) return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  return `${hrs}h ago`
}

function ReadmeTab({ readme }: { readme: string | null }) {
  const html = useMemo(() => {
    if (!readme) return ''
    try {
      const result = marked.parse(readme.slice(0, 8000))
      return typeof result === 'string' ? result : ''
    } catch {
      return readme.slice(0, 4000)
    }
  }, [readme])

  if (!readme) {
    return (
      <div className="p-5">
        <p className="text-sm text-[--color-text-muted] italic text-center py-8">No README found for this repository.</p>
      </div>
    )
  }

  return (
    <div className="p-5">
      <div
        className="md-prose max-h-[480px] overflow-y-auto"
        style={{}}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}

interface AIExplanationProps {
  repoData: RepoData
  analysis: RepoAnalysis
  autoLoad?: boolean
}

export function AIExplanation({ repoData, analysis, autoLoad = false }: AIExplanationProps) {
  const [mode, setMode] = useState<ExplanationMode>('quick')
  const [explanations, setExplanations] = useState<Partial<Record<ExplanationMode, string>>>({})
  const [generatedAt, setGeneratedAt] = useState<Partial<Record<ExplanationMode, Date>>>({})
  const [loadingModes, setLoadingModes] = useState<Set<ExplanationMode>>(new Set())
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<'badge' | 'summary' | 'link' | null>(null)
  const [, forceRender] = useState(0)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Ref to prevent race conditions in async loading
  const loadingRef = useRef<Set<ExplanationMode>>(new Set())

  const repo = repoData.repo
  const currentExplanation = explanations[mode]
  const currentGeneratedAt = generatedAt[mode]

  // Tick every 60 s to refresh "X min ago" display
  useEffect(() => {
    tickRef.current = setInterval(() => forceRender(n => n + 1), 60_000)
    return () => { if (tickRef.current) clearInterval(tickRef.current) }
  }, [])

  const siteUrl = window.location.origin
  const repoPageUrl = `${siteUrl}/repo/${repo.full_name}?ref=badge`
  const badgeUrl = `https://img.shields.io/badge/Explained%20by-GitHub%20Explainer-6366f1?style=flat&logo=github`
  const badgeMarkdown = `[![Explained by GitHub Explainer](${badgeUrl})](${repoPageUrl})`

  useEffect(() => {
    if (autoLoad && !explanations.quick) {
      fetchExplanation('quick')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad, repo.full_name])

  const fetchExplanation = async (m: ExplanationMode) => {
    if (m === 'readme') return  // README tab is static, no fetch needed
    // Use ref for immediate guard to prevent race conditions
    if (loadingRef.current.has(m)) return
    loadingRef.current.add(m)
    setLoadingModes(prev => new Set(prev).add(m))
    setError('')

    try {
      trackExplanationRequested(repo.full_name, m)
      const context = buildContext(repoData, analysis)

      const { data, error: fnError } = await supabase.functions.invoke('explain-code', {
        body: {
          type: 'explanation',
          content: context,
          context: {
            repoName: repo.full_name,
            mode: m,
            description: repo.description,
            language: analysis.primaryLanguage,
          },
        },
      })

      if (fnError) throw new Error(fnError.message)

      const explanation = data?.explanation ?? 'No explanation returned.'
      setExplanations(prev => ({ ...prev, [m]: explanation }))
      setGeneratedAt(prev => ({ ...prev, [m]: new Date() }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get explanation.')
    } finally {
      loadingRef.current.delete(m)
      setLoadingModes(prev => {
        const next = new Set(prev)
        next.delete(m)
        return next
      })
    }
  }

  const handleModeChange = (m: ExplanationMode) => {
    setMode(m)
    if (m !== 'readme' && !explanations[m]) {
      fetchExplanation(m)
    }
  }

  const refresh = () => {
    if (mode === 'readme') return
    setExplanations(prev => { const next = { ...prev }; delete next[mode]; return next })
    // Clear the loading ref to allow refetch
    loadingRef.current.delete(mode)
    fetchExplanation(mode)
  }

  const copyBadge = async () => {
    await navigator.clipboard.writeText(badgeMarkdown)
    trackBadgeCopied(repo.full_name)
    setCopied('badge')
    setTimeout(() => setCopied(null), 2000)
  }

  const copySummary = async () => {
    const text = currentExplanation ?? `${repo.full_name}: ${repo.description ?? ''}`
    await navigator.clipboard.writeText(text)
    setCopied('summary')
    setTimeout(() => setCopied(null), 2000)
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(repoPageUrl)
    setCopied('link')
    setTimeout(() => setCopied(null), 2000)
  }

  const readmeContent = repoData.readme

  return (
    <div className="bg-[--color-background-secondary] rounded-xl border border-[--color-border-default] overflow-hidden">
      {/* Mini repo header */}
      <div className="flex items-start gap-3 p-5 pb-4">
        <img
          src={repo.owner.avatar_url}
          alt={repo.owner.login}
          className="w-10 h-10 rounded-lg shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[--color-text-primary]">{repo.name}</span>
            <span className="flex items-center gap-1 text-sm text-[--color-text-secondary]">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 1.5l1.84 3.73 4.12.6-2.98 2.9.7 4.1L8 10.77l-3.68 1.93.7-4.1L2.04 5.83l4.12-.6L8 1.5z" />
              </svg>
              {repo.stargazers_count}
            </span>
            {repo.language && (
              <span className="flex items-center gap-1 text-sm text-[--color-text-secondary]">
                <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" />
                {repo.language}
              </span>
            )}
          </div>
          {repo.description && (
            <p className="text-sm text-[--color-text-secondary] mt-1 line-clamp-2">{repo.description}</p>
          )}
        </div>
        <span className="shrink-0 flex items-center gap-1 text-xs text-[--color-text-muted] bg-[--color-background] px-2.5 py-1 rounded-full">
          ✨ AI Explained
        </span>
      </div>

      {/* Divider */}
      <div className="border-t border-[--color-border-default] mx-5" />

      {/* Share row */}
      <div className="flex items-center justify-between gap-3 px-5 py-3">
        <span className="text-sm text-[--color-text-secondary]">Share this analysis</span>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={copyBadge}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-[--color-border-default] text-[--color-text-secondary] hover:text-[--color-text-primary] hover:border-[--color-text-secondary] transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="8" r="6.5" />
              <path d="M5.5 8h5M8 5.5v5" />
            </svg>
            {copied === 'badge' ? 'Copied!' : 'Copy Badge'}
          </button>
          <button
            onClick={copySummary}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-[--color-border-default] text-[--color-text-secondary] hover:text-[--color-text-primary] hover:border-[--color-text-secondary] transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="9" height="10" rx="1" />
              <path d="M4 4V3a1 1 0 011-1h7a1 1 0 011 1v9a1 1 0 01-1 1h-1" />
            </svg>
            {copied === 'summary' ? 'Copied!' : 'Copy Summary'}
          </button>
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-[--color-border-default] text-[--color-text-secondary] hover:text-[--color-text-primary] hover:border-[--color-text-secondary] transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6.5 9.5a3.5 3.5 0 005 0l2-2a3.5 3.5 0 00-5-5L7 4" />
              <path d="M9.5 6.5a3.5 3.5 0 00-5 0l-2 2a3.5 3.5 0 005 5L9 12" />
            </svg>
            {copied === 'link' ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>

      {/* Mode selector tab bar */}
      <div className="flex border-t border-[--color-border-default] overflow-x-auto">
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => handleModeChange(m.id)}
            className="flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap shrink-0"
            style={
              mode === m.id
                ? { borderBottom: '2px solid var(--color-accent-blue)', color: 'var(--color-text-primary)', marginBottom: '-1px' }
                : { borderBottom: '2px solid transparent', color: 'var(--color-text-secondary)', marginBottom: '-1px' }
            }
          >
            <span>{m.icon}</span>
            {m.label}
          </button>
        ))}
      </div>

      {/* README tab content */}
      {mode === 'readme' && (
        <ReadmeTab readme={readmeContent} />
      )}

      {/* AI explanation content */}
      {mode !== 'readme' && (
        <div className="min-h-[120px] p-5 pt-4">
          {/* Generated timestamp + refresh */}
          {currentGeneratedAt && !loadingModes.has(mode) && (
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[--color-text-muted]">Generated {timeAgo(currentGeneratedAt)}</span>
              <button
                onClick={refresh}
                className="flex items-center gap-1 text-xs text-[--color-text-muted] hover:text-[--color-text-secondary] transition-colors"
                title="Regenerate"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13.5 2.5A6.5 6.5 0 012.5 10" />
                  <path d="M2.5 13.5A6.5 6.5 0 0113.5 6" />
                  <path d="M13.5 2.5v3h-3" />
                  <path d="M2.5 13.5v-3h3" />
                </svg>
                Regenerate
              </button>
            </div>
          )}

          {loadingModes.has(mode) && (
            <div
              className="space-y-3 animate-pulse"
              role="status"
              aria-live="polite"
              aria-label="Loading explanation"
            >
              <div className="h-4 bg-[--color-background] rounded w-3/4" />
              <div className="h-4 bg-[--color-background] rounded w-full" />
              <div className="h-4 bg-[--color-background] rounded w-5/6" />
              <div className="h-4 bg-[--color-background] rounded w-2/3" />
              <div className="h-4 bg-[--color-background] rounded w-4/5" />
              <span className="sr-only">Loading...</span>
            </div>
          )}

          {!loadingModes.has(mode) && error && (
            <div className="p-4 bg-red-900/20 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
              <button
                onClick={() => fetchExplanation(mode)}
                className="mt-2 text-sm text-red-400 underline"
              >
                Try again
              </button>
            </div>
          )}

          {!loadingModes.has(mode) && !error && currentExplanation && (
            <div className="p-4 bg-[--color-background] rounded-lg text-sm text-[--color-text-secondary] whitespace-pre-wrap leading-relaxed">
              {currentExplanation}
            </div>
          )}

          {!loadingModes.has(mode) && !error && !currentExplanation && (
            <div className="flex items-center justify-center h-full p-8">
              <button
                onClick={() => fetchExplanation(mode)}
                className="px-6 py-3 bg-[--color-btn-primary-bg] text-white rounded-lg hover:bg-[--color-btn-primary-hover] transition-colors font-medium"
              >
                Generate Explanation
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
