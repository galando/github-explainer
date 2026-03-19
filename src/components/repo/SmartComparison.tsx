import { GitHubRepo } from '@/services/github'
import { RepoAnalysis } from '@/services/repoAnalyzer'

interface SmartComparisonProps {
  repo: GitHubRepo
  analysis: RepoAnalysis
}

// Suggest similar/related repos based on tech stack
const SIMILAR_REPOS: Record<string, { name: string; owner: string; reason: string }[]> = {
  React: [
    { owner: 'facebook', name: 'react', reason: 'The React library itself' },
    { owner: 'vercel', name: 'next.js', reason: 'React meta-framework' },
  ],
  Vue: [
    { owner: 'vuejs', name: 'vue', reason: 'The Vue library itself' },
    { owner: 'nuxt', name: 'nuxt', reason: 'Vue meta-framework' },
  ],
  'Next.js': [
    { owner: 'vercel', name: 'next.js', reason: 'Official Next.js repo' },
    { owner: 'vercel', name: 'examples', reason: 'Next.js examples' },
  ],
  Django: [
    { owner: 'django', name: 'django', reason: 'Django framework' },
  ],
  'Spring Boot': [
    { owner: 'spring-projects', name: 'spring-boot', reason: 'Spring Boot framework' },
  ],
}

export function SmartComparison({ repo, analysis }: SmartComparisonProps) {
  const suggestions: { name: string; owner: string; reason: string }[] = []
  const seen = new Set<string>()

  for (const tech of analysis.techStack) {
    const related = SIMILAR_REPOS[tech.name]
    if (related) {
      for (const r of related) {
        const key = `${r.owner}/${r.name}`
        if (!seen.has(key) && key !== repo.full_name) {
          seen.add(key)
          suggestions.push(r)
        }
      }
    }
  }

  if (suggestions.length === 0) return null

  return (
    <div className="bg-[--color-background-secondary] rounded-xl border border-[--color-border-default] p-6">
      <h3 className="font-semibold text-[--color-text-primary] mb-4">Related Repositories</h3>
      <div className="space-y-2">
        {suggestions.slice(0, 4).map(s => (
          <a
            key={`${s.owner}/${s.name}`}
            href={`/repo/${s.owner}/${s.name}`}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-[--color-background] transition-colors"
          >
            <span className="text-lg">📦</span>
            <div>
              <p className="text-sm font-medium text-[--color-text-primary]">{s.owner}/{s.name}</p>
              <p className="text-xs text-[--color-text-secondary]">{s.reason}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
