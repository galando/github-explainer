import { RepoAnalysis } from '@/services/repoAnalyzer'

interface DependencyGraphProps {
  analysis: RepoAnalysis
}

export function DependencyGraph({ analysis }: DependencyGraphProps) {
  const { packageManager, testingFrameworks, cicd } = analysis

  const sections: { title: string; items: string[]; color: string }[] = [
    packageManager
      ? { title: 'Package Manager', items: [packageManager], color: 'bg-emerald-900/20 text-emerald-400 border-emerald-800' }
      : null,
    testingFrameworks.length > 0
      ? { title: 'Testing', items: testingFrameworks, color: 'bg-purple-900/20 text-purple-400 border-purple-800' }
      : null,
    cicd.length > 0
      ? { title: 'CI / CD', items: cicd, color: 'bg-orange-900/20 text-orange-400 border-orange-800' }
      : null,
  ].filter(Boolean) as { title: string; items: string[]; color: string }[]

  if (sections.length === 0) return null

  return (
    <div className="bg-[--color-background-secondary] rounded-xl border border-[--color-border-default] p-6">
      <h3 className="font-semibold text-[--color-text-primary] mb-4">Tooling Overview</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sections.map(s => (
          <div key={s.title} className={`p-4 rounded-lg border ${s.color}`}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2 opacity-70">{s.title}</p>
            <div className="flex flex-wrap gap-2">
              {s.items.map(item => (
                <span key={item} className="text-sm font-medium">{item}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
