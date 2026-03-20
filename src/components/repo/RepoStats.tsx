import { GitHubRepo } from '@/services/github'
import { RepoAnalysis } from '@/services/repoAnalyzer'

function formatNum(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`
  const years = Math.floor(months / 12)
  return `${years} year${years > 1 ? 's' : ''} ago`
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Java: '#b07219',
  Go: '#00ADD8',
  Rust: '#dea584',
  Ruby: '#701516',
  PHP: '#4F5D95',
  'C++': '#f34b7d',
  'C#': '#178600',
  C: '#555555',
  Shell: '#89e051',
  Kotlin: '#A97BFF',
  Swift: '#F05138',
  Dart: '#00B4AB',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Vue: '#41b883',
  Svelte: '#ff3e00',
}

const COMPLEXITY_SCORE: Record<'simple' | 'moderate' | 'complex', number> = {
  simple: 30,
  moderate: 65,
  complex: 90,
}

const StarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className="text-[--color-text-secondary]">
    <path d="M8 1.5l1.84 3.73 4.12.6-2.98 2.9.7 4.1L8 10.77l-3.68 1.93.7-4.1L2.04 5.83l4.12-.6L8 1.5z" />
  </svg>
)

const ForkIcon = () => (
  <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className="text-[--color-text-secondary]">
    <circle cx="5" cy="3" r="1.5" />
    <circle cx="11" cy="3" r="1.5" />
    <circle cx="8" cy="13" r="1.5" />
    <path d="M5 4.5v1.5a3 3 0 003 3m3-4.5v1.5a3 3 0 01-3 3m0 0v2" />
  </svg>
)

const PersonIcon = () => (
  <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className="text-[--color-text-secondary]">
    <circle cx="8" cy="5" r="2.5" />
    <path d="M2.5 14c0-3.036 2.462-5.5 5.5-5.5s5.5 2.464 5.5 5.5" />
  </svg>
)

const FileIcon = () => (
  <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className="text-[--color-text-muted]">
    <path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" />
    <path d="M10 2v3h3" />
  </svg>
)

const FolderIcon = () => (
  <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className="text-[--color-text-muted]">
    <path d="M1.5 3.5h4l1.5 1.5H14.5v8.5H1.5z" />
  </svg>
)

const PackageIcon = () => (
  <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className="text-[--color-text-muted]">
    <path d="M8 1.5L1.5 5v6L8 14.5 14.5 11V5L8 1.5z" />
    <path d="M8 1.5v13M1.5 5L8 8.5 14.5 5" />
    <path d="M4.75 3.25L11.25 6.75" />
  </svg>
)

interface RepoStatsProps {
  repo: GitHubRepo
  analysis?: RepoAnalysis | null
  treeStats?: { files: number; folders: number }
  contributorsCount?: number
}

export function RepoStats({ repo, analysis, treeStats, contributorsCount }: RepoStatsProps) {
  const complexityScore = analysis ? COMPLEXITY_SCORE[analysis.complexity] : null
  const complexityLabel = analysis?.complexity
    ? analysis.complexity.charAt(0).toUpperCase() + analysis.complexity.slice(1)
    : null
  const languages = analysis?.languageBreakdown ?? []

  return (
    <div className="bg-[--color-background-secondary] rounded-xl border border-[--color-border-default] p-5">
      {/* Title */}
      <div className="flex items-center gap-2 mb-4">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[--color-text-secondary]">
          <rect x="1.5" y="8" width="3" height="6" rx="0.5" />
          <rect x="6.5" y="5" width="3" height="9" rx="0.5" />
          <rect x="11.5" y="2" width="3" height="12" rx="0.5" />
        </svg>
        <h3 className="font-semibold text-[--color-text-primary]">Repository Statistics</h3>
      </div>

      {/* Stars / Forks / Contributors row */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {[
          { icon: <StarIcon />, value: formatNum(repo.stargazers_count), label: 'Stars' },
          { icon: <ForkIcon />, value: formatNum(repo.forks_count), label: 'Forks' },
          { icon: <PersonIcon />, value: contributorsCount != null ? formatNum(contributorsCount) : '—', label: 'Contributors' },
        ].map(stat => (
          <div key={stat.label} className="flex flex-col items-center gap-1 py-3 bg-[--color-background] rounded-lg">
            {stat.icon}
            <span className="font-bold text-[--color-text-primary] text-lg leading-none">{stat.value}</span>
            <span className="text-xs text-[--color-text-secondary]">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Files / Folders / Dependencies row */}
      {treeStats && (
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { icon: <FileIcon />, value: treeStats.files, label: 'Files' },
            { icon: <FolderIcon />, value: treeStats.folders, label: 'Folders' },
            { icon: <PackageIcon />, value: analysis?.dependencies?.total ?? 0, label: 'Dependencies' },
          ].map(stat => (
            <div key={stat.label} className="flex flex-col items-center gap-1 py-3 bg-[--color-background] rounded-lg">
              {stat.icon}
              <span className="font-bold text-[--color-text-primary] text-lg leading-none">{stat.value}</span>
              <span className="text-xs text-[--color-text-secondary]">{stat.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Complexity score */}
      {complexityScore !== null && complexityLabel && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-[--color-text-secondary]">Complexity Score</span>
            <span className="font-medium text-[--color-text-primary]">{complexityLabel}</span>
          </div>
          <div className="h-1.5 bg-[--color-background] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${complexityScore}%`,
                backgroundColor:
                  complexityScore >= 80 ? '#f85149' : complexityScore >= 50 ? '#d29922' : '#3fb950',
              }}
            />
          </div>
        </div>
      )}

      {/* Language breakdown */}
      {languages.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-[--color-text-secondary] mb-2">Languages</p>
          <div className="space-y-2">
            {languages.slice(0, 5).map(lang => (
              <div key={lang.language}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[--color-text-primary] flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ backgroundColor: LANGUAGE_COLORS[lang.language] ?? '#8b949e' }}
                    />
                    {lang.language}
                  </span>
                  <span className="text-[--color-text-secondary]">{lang.percentage}%</span>
                </div>
                <div className="h-1.5 bg-[--color-background] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${lang.percentage}%`,
                      backgroundColor: LANGUAGE_COLORS[lang.language] ?? '#8b949e',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meta */}
      <div className="space-y-2 text-sm border-t border-[--color-border-default] pt-3">
        <div className="flex justify-between">
          <span className="text-[--color-text-secondary]">Last pushed</span>
          <span className="font-medium text-[--color-text-primary]">{timeAgo(repo.pushed_at)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[--color-text-secondary]">Created</span>
          <span className="font-medium text-[--color-text-primary]">{timeAgo(repo.created_at)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[--color-text-secondary]">Default branch</span>
          <span className="font-mono text-xs bg-[--color-background] px-2 py-0.5 rounded">{repo.default_branch}</span>
        </div>
        {repo.license && (
          <div className="flex justify-between">
            <span className="text-[--color-text-secondary]">License</span>
            <span className="font-medium text-[--color-text-primary]">{repo.license.spdx_id}</span>
          </div>
        )}
        {repo.topics.length > 0 && (
          <div className="pt-2">
            <p className="text-[--color-text-secondary] mb-2">Topics</p>
            <div className="flex flex-wrap gap-1">
              {repo.topics.slice(0, 8).map(t => (
                <span
                  key={t}
                  className="px-2 py-0.5 bg-[--color-background] text-[--color-accent-blue] text-xs rounded-full"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
