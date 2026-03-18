interface KeyFilesProps {
  keyFiles: { path: string; reason: string }[]
  repoUrl: string
  defaultBranch: string
}

export function KeyFiles({ keyFiles, repoUrl, defaultBranch }: KeyFilesProps) {
  if (keyFiles.length === 0) return null

  return (
    <div className="bg-[--color-background-secondary] rounded-xl border border-[--color-border-default] p-6">
      <h3 className="font-semibold text-[--color-text-primary] mb-4">Key Files</h3>
      <div className="space-y-2">
        {keyFiles.map(f => (
          <a
            key={f.path}
            href={`${repoUrl}/blob/${defaultBranch}/${f.path}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 p-2 rounded-lg hover:bg-[--color-background] transition-colors group"
          >
            <span className="text-[--color-text-muted] group-hover:text-[--color-accent-blue] mt-0.5">📄</span>
            <div>
              <p className="font-mono text-sm text-[--color-text-primary] group-hover:text-[--color-accent-blue]">{f.path}</p>
              <p className="text-xs text-[--color-text-secondary]">{f.reason}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
