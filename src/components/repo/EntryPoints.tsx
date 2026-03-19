import { EntryPoint } from '@/services/repoAnalyzer'

const TYPE_ICONS: Record<string, string> = {
  main: '🚀',
  config: '⚙️',
  test: '🧪',
  docs: '📄',
  ci: '🔄',
}

interface EntryPointsProps {
  entryPoints: EntryPoint[]
  repoUrl: string
  defaultBranch: string
}

export function EntryPoints({ entryPoints, repoUrl, defaultBranch }: EntryPointsProps) {
  if (entryPoints.length === 0) return null

  return (
    <div className="bg-[--color-background-secondary] rounded-xl border border-[--color-border-default] p-6">
      <h3 className="font-semibold text-[--color-text-primary] mb-4">Entry Points</h3>
      <div className="space-y-2">
        {entryPoints.map(ep => (
          <a
            key={ep.path}
            href={`${repoUrl}/blob/${defaultBranch}/${ep.path}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-[--color-background] transition-colors group"
          >
            <span className="text-lg shrink-0">{TYPE_ICONS[ep.type] ?? '📁'}</span>
            <div className="min-w-0">
              <p className="font-mono text-sm text-[--color-text-primary] truncate group-hover:text-[--color-accent-blue]">
                {ep.path}
              </p>
              <p className="text-xs text-[--color-text-secondary]">{ep.description}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
