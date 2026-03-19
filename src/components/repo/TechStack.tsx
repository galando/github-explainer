import { RepoAnalysis } from '@/services/repoAnalyzer'
import { LANGUAGE_COLORS } from '@/services/github'

const CATEGORY_ORDER = ['language', 'framework', 'library', 'database', 'cloud'] as const

interface TechStackProps {
  analysis: RepoAnalysis
}

export function TechStack({ analysis }: TechStackProps) {
  const { techStack, languageBreakdown, cicd, testingFrameworks, packageManager } = analysis

  // Exclude items already represented by cicd / testingFrameworks / packageManager
  // to avoid duplicates (e.g. "GitHub Actions" appearing both here and in CI/CD)
  const excluded = new Set([
    ...cicd,
    ...testingFrameworks,
    ...(packageManager ? [packageManager] : []),
  ].map(s => s.toLowerCase()))

  const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    const items = techStack.filter(
      t => t.category === cat && !excluded.has(t.name.toLowerCase())
    )
    if (items.length > 0) acc[cat] = items
    return acc
  }, {} as Record<string, typeof techStack>)

  const hasContent = languageBreakdown.length > 0 || Object.keys(grouped).length > 0
  if (!hasContent) return null

  return (
    <div className="bg-[--color-background-secondary] rounded-xl border border-[--color-border-default] p-6">
      <h3 className="font-semibold text-[--color-text-primary] mb-4">Tech Stack</h3>

      {/* Language bar */}
      {languageBreakdown.length > 0 && (
        <div className="mb-6">
          <div className="flex rounded-full overflow-hidden h-2.5 mb-2">
            {languageBreakdown.slice(0, 6).map(l => (
              <div
                key={l.language}
                style={{ width: `${l.percentage}%`, backgroundColor: LANGUAGE_COLORS[l.language] ?? '#8b8b8b' }}
                title={`${l.language}: ${l.percentage}%`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {languageBreakdown.slice(0, 6).map(l => (
              <div key={l.language} className="flex items-center gap-1 text-xs text-[--color-text-secondary]">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: LANGUAGE_COLORS[l.language] ?? '#8b8b8b' }} />
                {l.language}
                <span className="text-[--color-text-muted]">{l.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tech by category */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <p className="text-xs font-medium text-[--color-text-muted] uppercase tracking-wider mb-2">{category}</p>
            <div className="flex flex-wrap gap-2">
              {items.map(item => (
                <span key={item.name} className="px-3 py-1 bg-[--color-background] text-[--color-text-secondary] text-sm rounded-full border border-[--color-border-default] font-medium">
                  {item.name}
                  {item.confidence === 'low' && (
                    <span className="text-[--color-text-muted] ml-1 text-xs">(possible)</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
