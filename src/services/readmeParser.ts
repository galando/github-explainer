export interface ParsedReadme {
  title: string | null
  description: string | null
  installation: string | null
  usage: string | null
  badges: string[]
  sections: { heading: string; content: string }[]
  raw: string
}

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim()
}

function extractBadges(text: string): string[] {
  const badges: string[] = []
  // Markdown image links: [![alt](img)](url) or ![alt](img)
  const regex = /!\[([^\]]*)\]\(([^)]+)\)/g
  let match
  while ((match = regex.exec(text)) !== null) {
    const src = match[2]
    if (
      src.includes('shields.io') ||
      src.includes('badge') ||
      src.includes('travis-ci') ||
      src.includes('circleci') ||
      src.includes('codecov') ||
      src.includes('img.shields')
    ) {
      badges.push(src)
    }
  }
  return badges
}

function splitSections(text: string): { heading: string; content: string }[] {
  const lines = text.split('\n')
  const sections: { heading: string; content: string }[] = []
  let currentHeading = ''
  let currentLines: string[] = []

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/)
    if (headingMatch) {
      if (currentLines.length > 0) {
        sections.push({
          heading: currentHeading,
          content: currentLines.join('\n').trim(),
        })
      }
      currentHeading = headingMatch[2].trim()
      currentLines = []
    } else {
      currentLines.push(line)
    }
  }

  if (currentLines.length > 0) {
    sections.push({ heading: currentHeading, content: currentLines.join('\n').trim() })
  }

  return sections.filter(s => s.content.length > 0)
}

function findSection(sections: { heading: string; content: string }[], keywords: string[]): string | null {
  for (const section of sections) {
    const h = section.heading.toLowerCase()
    if (keywords.some(k => h.includes(k))) {
      return section.content
    }
  }
  return null
}

export function parseReadme(raw: string): ParsedReadme {
  if (!raw) {
    return {
      title: null,
      description: null,
      installation: null,
      usage: null,
      badges: [],
      sections: [],
      raw: '',
    }
  }

  const lines = raw.split('\n')
  const sections = splitSections(raw)
  const badges = extractBadges(raw)

  // Extract title from first h1
  let title: string | null = null
  for (const line of lines) {
    const m = line.match(/^#\s+(.+)/)
    if (m) {
      title = m[1].trim()
      break
    }
  }

  // Description: first non-empty paragraph that isn't a heading or badge
  let description: string | null = null
  let inCodeBlock = false
  const descLines: string[] = []

  for (const line of lines) {
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock
      continue
    }
    if (inCodeBlock) continue
    if (line.startsWith('#')) continue
    if (line.includes('shields.io') || line.includes('badge')) continue
    if (line.trim().length === 0) {
      if (descLines.length > 0) break
      continue
    }
    descLines.push(line.trim())
    if (descLines.length >= 3) break
  }

  if (descLines.length > 0) {
    description = stripHtml(descLines.join(' '))
  }

  const installation = findSection(sections, ['install', 'setup', 'getting started', 'quick start'])
  const usage = findSection(sections, ['usage', 'example', 'how to use', 'guide'])

  return {
    title,
    description,
    installation,
    usage,
    badges,
    sections,
    raw,
  }
}
