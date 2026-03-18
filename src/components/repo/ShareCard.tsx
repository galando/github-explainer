import { useState } from 'react'
import { GitHubRepo } from '@/services/github'
import { trackBadgeCopied } from '@/lib/analytics'

interface ShareCardProps {
  repo: GitHubRepo
}

export function ShareCard({ repo }: ShareCardProps) {
  const [copied, setCopied] = useState<'badge' | 'link' | null>(null)

  const siteUrl = window.location.origin
  const repoPageUrl = `${siteUrl}/repo/${repo.full_name}?ref=badge`

  // Badge markdown that links back to the site
  const badgeUrl = `https://img.shields.io/badge/Explained%20by-GitHub%20Explainer-6366f1?style=flat&logo=github`
  const badgeMarkdown = `[![Explained by GitHub Explainer](${badgeUrl})](${repoPageUrl})`

  const copyBadge = async () => {
    await navigator.clipboard.writeText(badgeMarkdown)
    trackBadgeCopied(repo.full_name)
    setCopied('badge')
    setTimeout(() => setCopied(null), 2000)
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(repoPageUrl)
    setCopied('link')
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="bg-[--color-background-secondary] rounded-xl border border-[--color-border-default] p-4">
      <h3 className="text-sm font-semibold text-[--color-text-primary] mb-1">Share this analysis</h3>
      <p className="text-xs text-[--color-text-secondary] mb-3">
        Add a badge to your README so others can explore this repo with AI.
      </p>

      {/* Compact badge preview */}
      <div className="flex items-center gap-3 bg-[--color-background] rounded-lg px-3 py-2 mb-3 border border-[--color-border-default]">
        <span className="text-xs text-[--color-text-muted] shrink-0">Preview</span>
        <img src={badgeUrl} alt="Explained by GitHub Explainer" className="h-4" />
      </div>

      {/* Badge markdown — truncated single line */}
      <div className="bg-[--color-background] rounded-lg px-3 py-2 mb-3 overflow-hidden">
        <code className="text-[--color-text-muted] text-xs block truncate">{badgeMarkdown}</code>
      </div>

      <div className="flex gap-2">
        <button
          onClick={copyBadge}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium bg-[--color-background] border border-[--color-border-default] text-[--color-text-secondary] rounded-lg hover:text-[--color-text-primary] transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="9" height="11" rx="1" />
            <rect x="5" y="1" width="9" height="11" rx="1" fill="var(--color-background-secondary)" stroke="currentColor" />
          </svg>
          {copied === 'badge' ? 'Copied!' : 'Copy Badge Markdown'}
        </button>
        <button
          onClick={copyLink}
          className="flex items-center justify-center py-1.5 px-3 bg-[--color-background] border border-[--color-border-default] text-[--color-text-secondary] text-xs rounded-lg hover:text-[--color-text-primary] transition-colors"
          title="Copy link to this analysis"
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6.5 9.5a3.5 3.5 0 005 0l2-2a3.5 3.5 0 00-5-5L7 4" />
            <path d="M9.5 6.5a3.5 3.5 0 00-5 0l-2 2a3.5 3.5 0 005 5L9 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
