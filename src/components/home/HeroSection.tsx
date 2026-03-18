import { useState } from 'react'
import { useNavigate } from 'react-router'
import {
  Search,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Zap,
  GitBranch,
  MessageSquare,
  Package,
  FileCode,
  GitCompare,
  Layers,
} from 'lucide-react'

export default function HeroSection() {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const parseGitHubUrl = (input: string): { owner: string; repo: string } | null => {
    const trimmed = input.trim()

    const urlPatterns = [
      /https?:\/\/github\.com\/([^\/]+)\/([^\/\s\?#]+)/,
      /github\.com\/([^\/]+)\/([^\/\s\?#]+)/,
    ]

    for (const pattern of urlPatterns) {
      const match = trimmed.match(pattern)
      if (match) {
        return { owner: match[1], repo: match[2].replace(/\.git$/, '') }
      }
    }

    const shortMatch = trimmed.match(/^([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+)$/)
    if (shortMatch) {
      return { owner: shortMatch[1], repo: shortMatch[2] }
    }

    return null
  }

  const handleExplain = () => {
    setError('')
    const trimmedUrl = url.trim()
    if (!trimmedUrl) {
      setError('Please enter a GitHub repository URL')
      return
    }
    const parsed = parseGitHubUrl(trimmedUrl)
    if (!parsed) {
      setError('Use format: github.com/owner/repo or owner/repo')
      return
    }
    navigate(`/repo/${parsed.owner}/${parsed.repo}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleExplain()
    }
  }

  const quickExamples = [
    { name: 'React', slug: 'facebook/react' },
    { name: 'Next.js', slug: 'vercel/next.js' },
    { name: 'FastAPI', slug: 'tiangolo/fastapi' },
    { name: 'Supabase', slug: 'supabase/supabase' },
  ]

  const features = [
    { icon: <Zap className="w-4 h-4" />, title: 'AI Explanation', desc: '4 depth levels' },
    { icon: <Layers className="w-4 h-4" />, title: 'Architecture', desc: 'Visual diagrams' },
    { icon: <MessageSquare className="w-4 h-4" />, title: 'Ask AI', desc: 'Chat about code' },
    { icon: <Package className="w-4 h-4" />, title: 'Tech Stack', desc: 'Dependencies' },
    { icon: <FileCode className="w-4 h-4" />, title: 'Key Files', desc: 'Entry points' },
    { icon: <GitCompare className="w-4 h-4" />, title: 'Compare', desc: 'Similar repos' },
  ]

  return (
    <section className="flex flex-col items-center justify-center text-center px-4 pt-20 pb-16">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[--color-border-default] text-[--color-text-secondary] text-sm mb-8">
        <Sparkles className="w-3.5 h-3.5 text-[--color-accent-blue]" />
        AI-powered code understanding
      </div>

      {/* Heading */}
      <h1 className="text-5xl sm:text-6xl font-bold text-[--color-text-primary] mb-6 leading-tight tracking-tight">
        Understand Any GitHub
      </h1>

      {/* Subtitle */}
      <p className="text-lg text-[--color-text-secondary] mb-10 max-w-lg">
        Paste a GitHub URL and get an instant AI explanation of how the code works.
      </p>

      {/* Search bar */}
      <div className="w-full max-w-2xl flex gap-2 mb-4">
        <div className="flex-1 flex items-center gap-3 px-4 py-3.5 rounded-xl border border-[--color-border-default] bg-[--color-background-secondary] focus-within:border-[--color-accent-blue] focus-within:ring-1 focus-within:ring-[--color-accent-blue] transition-colors">
          <Search className="w-4 h-4 text-[--color-text-muted] shrink-0" />
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="github.com/owner/repo or owner/repo"
            className="flex-1 bg-transparent text-[--color-text-primary] placeholder:text-[--color-text-muted] text-sm outline-none"
            autoFocus
          />
        </div>
        <button
          onClick={handleExplain}
          className="flex items-center gap-2 px-6 py-3.5 bg-[--color-accent-blue] hover:opacity-90 text-white font-semibold rounded-xl transition-opacity text-sm"
        >
          Explain
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm mb-4">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Quick examples */}
      <div className="flex items-center gap-2 flex-wrap justify-center mb-12">
        <span className="text-[--color-text-muted] text-sm">Try:</span>
        {quickExamples.map(ex => (
          <button
            key={ex.slug}
            onClick={() => navigate(`/repo/${ex.slug}`)}
            className="px-3 py-1 rounded-full border border-[--color-border-default] text-[--color-text-secondary] text-sm hover:border-[--color-accent-blue] hover:text-[--color-text-primary] transition-colors"
          >
            {ex.name}
          </button>
        ))}
      </div>

      {/* Feature pills */}
      <div className="flex flex-wrap justify-center gap-3">
        {features.map(f => (
          <div
            key={f.title}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-[--color-border-default] bg-[--color-background-secondary] text-[--color-text-secondary]"
          >
            <span className="text-[--color-text-muted]">{f.icon}</span>
            <div className="text-left">
              <div className="text-xs font-semibold text-[--color-text-primary] leading-tight">{f.title}</div>
              <div className="text-xs text-[--color-text-muted] leading-tight">{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
