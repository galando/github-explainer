import { GitHubRepo, GitHubContributor } from '@/services/github'

interface ProjectOverviewProps {
  repo: GitHubRepo
  contributors: GitHubContributor[]
}

function formatNum(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return '1 day ago'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`
  const years = Math.floor(months / 12)
  return `${years} year${years > 1 ? 's' : ''} ago`
}

const StarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 1.5l1.84 3.73 4.12.6-2.98 2.9.7 4.1L8 10.77l-3.68 1.93.7-4.1L2.04 5.83l4.12-.6L8 1.5z" />
  </svg>
)

const ForkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5" cy="3" r="1.5" />
    <circle cx="11" cy="3" r="1.5" />
    <circle cx="8" cy="13" r="1.5" />
    <path d="M5 4.5v1.5a3 3 0 003 3m3-4.5v1.5a3 3 0 01-3 3m0 0v2" />
  </svg>
)

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" />
    <circle cx="8" cy="8" r="2" />
  </svg>
)

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="6.5" />
    <path d="M8 4.5V8l2.5 2.5" />
  </svg>
)

const ExternalLinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 3H3a1 1 0 00-1 1v9a1 1 0 001 1h9a1 1 0 001-1V9" />
    <path d="M10 2h4v4" />
    <path d="M14 2L8 8" />
  </svg>
)

export function ProjectOverview({ repo, contributors }: ProjectOverviewProps) {
  return (
    <div>
      {/* Top row: avatar + name + View on GitHub */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-start gap-4">
          <img
            src={repo.owner.avatar_url}
            alt={repo.owner.login}
            className="w-14 h-14 rounded-lg shrink-0"
          />
          <div>
            <h1 className="text-2xl font-bold text-[--color-text-primary] leading-tight">{repo.name}</h1>
            <p className="text-sm text-[--color-text-secondary] mt-0.5">by {repo.owner.login}</p>
          </div>
        </div>
        <a
          href={repo.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 flex items-center gap-1.5 text-sm text-[--color-text-secondary] hover:text-[--color-text-primary] transition-colors py-1"
        >
          <ExternalLinkIcon />
          View on GitHub
        </a>
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[--color-text-secondary] mb-3">
        <span className="flex items-center gap-1.5">
          <StarIcon />
          <span><strong className="text-[--color-text-primary]">{formatNum(repo.stargazers_count)}</strong> stars</span>
        </span>
        <span className="flex items-center gap-1.5">
          <ForkIcon />
          <span><strong className="text-[--color-text-primary]">{formatNum(repo.forks_count)}</strong> forks</span>
        </span>
        <span className="flex items-center gap-1.5">
          <EyeIcon />
          <span><strong className="text-[--color-text-primary]">{formatNum(repo.subscribers_count)}</strong> watchers</span>
        </span>
        <span className="flex items-center gap-1.5">
          <ClockIcon />
          <span>Updated {timeAgo(repo.pushed_at)}</span>
        </span>
        {repo.language && (
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-green-400 inline-block" />
            <span>{repo.language}</span>
          </span>
        )}
        {repo.homepage && (
          <a
            href={repo.homepage}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[--color-accent-blue] hover:underline"
          >
            {repo.homepage}
          </a>
        )}
      </div>

      {/* Description */}
      {repo.description && (
        <p className="text-sm text-[--color-text-secondary] mb-3">{repo.description}</p>
      )}

      {/* Contributors */}
      {contributors.length > 0 && (
        <div className="pt-3 border-t border-[--color-border-default]">
          <p className="text-sm text-[--color-text-secondary] mb-2">Top contributors</p>
          <div className="flex items-center gap-1">
            {contributors.slice(0, 10).map(c => (
              <a
                key={c.login}
                href={c.html_url}
                target="_blank"
                rel="noopener noreferrer"
                title={`${c.login} (${c.contributions} commits)`}
              >
                <img
                  src={c.avatar_url}
                  alt={c.login}
                  className="w-7 h-7 rounded-full border border-[--color-border-default] hover:scale-110 transition-transform"
                />
              </a>
            ))}
            {contributors.length > 10 && (
              <span className="text-sm text-[--color-text-secondary] ml-1">+{contributors.length - 10}</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
