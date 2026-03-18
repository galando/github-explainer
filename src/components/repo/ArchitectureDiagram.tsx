import { useState } from 'react'

interface TreeItem {
  path: string
  type: string
}

interface ArchitectureDiagramProps {
  tree: TreeItem[]
}

type LayerName = 'UI Layer' | 'Service' | 'Infra' | 'Tests' | 'Data'

const LAYER_PATTERNS: { layer: LayerName; color: string; dotColor: string; patterns: RegExp[] }[] = [
  {
    layer: 'UI Layer',
    color: 'bg-blue-600',
    dotColor: '#3b82f6',
    patterns: [
      /^(src|templates|views|components|pages|public|static|assets|styles|theme|ui|frontend|web|client|app)\//i,
      /^(src|templates|views|components|pages|public|static|assets|styles|theme|ui|frontend|web|client|app)$/i,
    ],
  },
  {
    layer: 'Service',
    color: 'bg-purple-600',
    dotColor: '#9333ea',
    patterns: [
      /^(api|server|services|service|controllers|routes|handlers|middleware|lib|core|backend|domain|application)\//i,
      /^(api|server|services|service|controllers|routes|handlers|middleware|lib|core|backend|domain|application)$/i,
    ],
  },
  {
    layer: 'Data',
    color: 'bg-green-600',
    dotColor: '#16a34a',
    patterns: [
      /^(db|database|migrations|models|model|data|seeds|prisma|schema)\//i,
      /^(db|database|migrations|models|model|data|seeds|prisma|schema)$/i,
    ],
  },
  {
    layer: 'Tests',
    color: 'bg-yellow-600',
    dotColor: '#ca8a04',
    patterns: [
      /^(tests?|spec|__tests__|cypress|e2e|fixtures|test_data|jest)\//i,
      /^(tests?|spec|__tests__|cypress|e2e|fixtures|test_data|jest)$/i,
    ],
  },
  {
    layer: 'Infra',
    color: 'bg-slate-500',
    dotColor: '#64748b',
    patterns: [
      /^(scripts?|docs?|\.github|config|deploy|infra|k8s|terraform|ci|bin|tools?|build|dist|out|coverage)\//i,
      /^(scripts?|docs?|config|deploy|infra|k8s|terraform|ci|bin|tools?|build|dist|out|coverage|\.github)$/i,
    ],
  },
]

interface FolderInfo {
  name: string
  layer: LayerName
  fileCount: number
  color: string
  dotColor: string
}

function buildFolderMap(tree: TreeItem[]): FolderInfo[] {
  const topLevelDirs = new Set<string>()
  const fileCounts: Record<string, number> = {}

  for (const item of tree) {
    const parts = item.path.split('/')
    if (parts.length < 2) continue

    const topDir = parts[0]
    if (topDir.startsWith('.') && topDir !== '.github') continue
    topLevelDirs.add(topDir)

    if (item.type === 'blob') {
      fileCounts[topDir] = (fileCounts[topDir] ?? 0) + 1
    }
  }

  const folders: FolderInfo[] = []

  for (const dir of topLevelDirs) {
    let assignedLayer: LayerName = 'Infra'
    let color = 'bg-slate-500'
    let dotColor = '#64748b'

    for (const { layer, color: c, dotColor: dc, patterns } of LAYER_PATTERNS) {
      if (patterns.some(p => p.test(`${dir}/`) || p.test(dir))) {
        assignedLayer = layer
        color = c
        dotColor = dc
        break
      }
    }

    const count = fileCounts[dir] ?? 0
    if (count === 0 && !tree.some(t => t.path.startsWith(`${dir}/`))) continue

    folders.push({
      name: dir,
      layer: assignedLayer,
      fileCount: count,
      color,
      dotColor,
    })
  }

  return folders.sort((a, b) => b.fileCount - a.fileCount)
}

function getFilesInFolder(tree: TreeItem[], folderName: string): string[] {
  return tree
    .filter(item => item.type === 'blob' && item.path.startsWith(`${folderName}/`))
    .map(item => item.path.slice(folderName.length + 1))
    .sort()
    .slice(0, 40)
}

export function ArchitectureDiagram({ tree }: ArchitectureDiagramProps) {
  const folders = buildFolderMap(tree)

  if (folders.length === 0) return null

  const layers = [...new Set(folders.map(f => f.layer))]
  const [activeLayer, setActiveLayer] = useState<LayerName | null>(null)
  const [selectedFolder, setSelectedFolder] = useState<FolderInfo | null>(null)

  const visibleFolders = activeLayer
    ? folders.filter(f => f.layer === activeLayer)
    : folders

  const layerDots: Record<LayerName, string> = {
    'UI Layer': '#3b82f6',
    Service: '#9333ea',
    Data: '#16a34a',
    Tests: '#ca8a04',
    Infra: '#64748b',
  }

  const folderFiles = selectedFolder ? getFilesInFolder(tree, selectedFolder.name) : []

  return (
    <div className="bg-[--color-background-secondary] rounded-xl border border-[--color-border-default] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-[--color-border-default]">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[--color-text-secondary]">
          <rect x="1" y="1" width="6" height="5" rx="1" />
          <rect x="9" y="1" width="6" height="5" rx="1" />
          <rect x="1" y="10" width="6" height="5" rx="1" />
          <rect x="9" y="10" width="6" height="5" rx="1" />
        </svg>
        <h3 className="font-semibold text-[--color-text-primary]">Architecture</h3>
        <span className="text-sm text-[--color-text-muted]">Detected folders from project structure</span>
      </div>

      {/* Layer filter tabs */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-[--color-border-default] flex-wrap">
        {layers.map(layer => (
          <button
            key={layer}
            onClick={() => {
              setActiveLayer(activeLayer === layer ? null : layer)
              setSelectedFolder(null)
            }}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors"
            style={
              activeLayer === layer
                ? { backgroundColor: layerDots[layer], color: '#fff' }
                : { backgroundColor: 'var(--color-background)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-default)' }
            }
          >
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ backgroundColor: activeLayer === layer ? 'rgba(255,255,255,0.7)' : layerDots[layer] }}
            />
            {layer}
          </button>
        ))}
      </div>

      {/* Folder grid */}
      <div className="p-5">
        {layers
          .filter(l => !activeLayer || l === activeLayer)
          .map(layer => {
            const layerFolders = visibleFolders.filter(f => f.layer === layer)
            if (layerFolders.length === 0) return null
            return (
              <div key={layer} className="mb-5 last:mb-0">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: layerDots[layer] }} />
                  <span className="text-xs font-semibold text-[--color-text-secondary] uppercase tracking-wider">{layer}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {layerFolders.map(folder => (
                    <button
                      key={folder.name}
                      onClick={() => setSelectedFolder(selectedFolder?.name === folder.name ? null : folder)}
                      className="flex flex-col items-center justify-center px-5 py-3 rounded-lg text-white font-semibold text-sm transition-all hover:opacity-90 min-w-[100px]"
                      style={{
                        backgroundColor: folder.dotColor,
                        outline: selectedFolder?.name === folder.name ? '2px solid white' : 'none',
                        outlineOffset: '2px',
                      }}
                    >
                      <span>{folder.name}</span>
                      <span className="text-xs font-normal opacity-80 mt-0.5">{folder.fileCount} files</span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
      </div>

      {/* File explorer panel - shown when a folder is selected */}
      {selectedFolder && (
        <div className="border-t border-[--color-border-default] p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[--color-text-secondary]">
                <path d="M2 3.5A1.5 1.5 0 013.5 2h3l1.5 2H14a1.5 1.5 0 011.5 1.5v7A1.5 1.5 0 0114 14H3.5A1.5 1.5 0 012 12.5V3.5z" />
              </svg>
              <span className="text-sm font-medium text-[--color-text-primary]">{selectedFolder.name}/</span>
              <span className="text-xs text-[--color-text-muted]">{selectedFolder.fileCount} files</span>
            </div>
            <button
              onClick={() => setSelectedFolder(null)}
              className="text-xs text-[--color-text-muted] hover:text-[--color-text-secondary] transition-colors"
            >
              Close
            </button>
          </div>
          <div className="bg-[--color-background] rounded-lg p-3 max-h-48 overflow-y-auto">
            {folderFiles.length > 0 ? (
              <div className="space-y-1">
                {folderFiles.map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-[--color-text-secondary] font-mono py-0.5">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[--color-text-muted]">
                      <path d="M4 2h6l3 3v9a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" />
                      <path d="M10 2v3h3" />
                    </svg>
                    {f}
                  </div>
                ))}
                {selectedFolder.fileCount > 40 && (
                  <p className="text-xs text-[--color-text-muted] pt-1">... and {selectedFolder.fileCount - 40} more files</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-[--color-text-muted] italic">No files found in this folder.</p>
            )}
          </div>
        </div>
      )}

      {/* Footer hint */}
      {!selectedFolder && (
        <div className="px-5 py-2 border-t border-[--color-border-default] text-center">
          <p className="text-xs text-[--color-text-muted]">Click any folder to explore its files</p>
        </div>
      )}
    </div>
  )
}
