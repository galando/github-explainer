import { GitHubRepo } from '@/services/github'
import { RepoAnalysis } from '@/services/repoAnalyzer'

interface RepoOverviewProps {
  repo: GitHubRepo
  analysis: RepoAnalysis
}

function inferAudience(analysis: RepoAnalysis, repo: GitHubRepo): string {
  const lang = analysis.primaryLanguage?.toLowerCase() ?? repo.language?.toLowerCase() ?? ''
  const tech = analysis.techStack.map(t => t.name.toLowerCase())

  if (tech.some(t => t.includes('react') || t.includes('vue') || t.includes('angular') || t.includes('svelte'))) {
    return 'Frontend and full-stack developers'
  }
  if (tech.some(t => t.includes('spring') || t.includes('django') || t.includes('rails') || t.includes('laravel'))) {
    return 'Backend developers'
  }
  if (lang.includes('python') && tech.some(t => t.includes('pytorch') || t.includes('tensorflow') || t.includes('numpy'))) {
    return 'Data scientists and ML engineers'
  }
  if (lang.includes('shell') || lang.includes('bash') || tech.some(t => t.includes('docker') || t.includes('terraform') || t.includes('kubernetes'))) {
    return 'DevOps engineers and developers'
  }
  if (lang.includes('swift') || lang.includes('kotlin') || lang.includes('dart')) {
    return 'Mobile developers'
  }
  if (lang.includes('rust') || lang.includes('c') || lang.includes('c++')) {
    return 'Systems programmers'
  }
  return 'Developers and technical users'
}

function buildCapabilities(analysis: RepoAnalysis): string[] {
  const caps: string[] = []

  // From architecture patterns
  for (const pattern of analysis.architecture.slice(0, 2)) {
    caps.push(pattern.description)
  }

  // From CI/CD
  if (analysis.cicd.length > 0) {
    caps.push(`Automated CI/CD via ${analysis.cicd.join(', ')}`)
  }

  // From testing
  if (analysis.testingFrameworks.length > 0) {
    caps.push(`Tested with ${analysis.testingFrameworks.slice(0, 2).join(' and ')}`)
  }

  // From package manager
  if (analysis.packageManager) {
    caps.push(`${analysis.packageManager} for dependency management`)
  }

  // Fallback: key tech
  if (caps.length < 2) {
    const tech = analysis.techStack
      .filter(t => t.confidence === 'high' && t.category !== 'language')
      .slice(0, 3)
      .map(t => t.name)
    if (tech.length > 0) {
      caps.push(`Built with ${tech.join(', ')}`)
    }
  }

  return caps.slice(0, 4)
}

export function RepoOverview({ repo, analysis }: RepoOverviewProps) {
  const audience = inferAudience(analysis, repo)
  const capabilities = buildCapabilities(analysis)

  const columns = [
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="8" r="6.5" />
          <circle cx="8" cy="8" r="2" />
        </svg>
      ),
      label: 'What it does',
      content: repo.description ?? `A ${analysis.primaryLanguage ?? 'software'} project.`,
      isList: false,
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="4.5" r="2" />
          <circle cx="11" cy="4.5" r="2" />
          <path d="M1 13.5c0-2.485 2.239-4.5 5-4.5" />
          <path d="M9.5 10.5c1.38 0 2.5 1.12 2.5 2.5v.5" />
        </svg>
      ),
      label: "Who it's for",
      content: audience,
      isList: false,
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 8l4 4 8-8" />
        </svg>
      ),
      label: 'Main capabilities',
      content: capabilities,
      isList: true,
    },
  ]

  return (
    <div className="bg-[--color-background-secondary] rounded-xl border border-[--color-border-default] overflow-hidden">
      <div className="px-5 py-4 border-b border-[--color-border-default]">
        <h2 className="font-semibold text-[--color-text-primary]">Overview</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[--color-border-default]">
        {columns.map(col => (
          <div key={col.label} className="p-5">
            <div className="flex items-center gap-2 mb-3 text-[--color-text-secondary]">
              {col.icon}
              <span className="text-sm font-semibold text-[--color-text-primary]">{col.label}</span>
            </div>
            {col.isList ? (
              <ul className="space-y-2">
                {(col.content as string[]).map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm text-[--color-text-secondary]">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[--color-text-muted] shrink-0" />
                    {item}
                  </li>
                ))}
                {(col.content as string[]).length === 0 && (
                  <li className="text-sm text-[--color-text-muted] italic">No capabilities detected</li>
                )}
              </ul>
            ) : (
              <p className="text-sm text-[--color-text-secondary] leading-relaxed">{col.content as string}</p>
            )}
          </div>
        ))}
      </div>

      <div className="px-5 py-3 border-t border-[--color-border-default] flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[--color-text-muted]">
          <path d="M8 2l1.5 3 3.5.5-2.5 2.5.5 3.5L8 10l-3 1.5.5-3.5L3 5.5 6.5 5z" />
        </svg>
        <span className="text-sm text-[--color-text-muted]">Enhance with AI</span>
      </div>
    </div>
  )
}
