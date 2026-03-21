import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { Code2, Brain, Globe, Settings, Database, Smartphone, Loader2 } from 'lucide-react'

const CATEGORIES = [
  { slug: 'javascript', label: 'JavaScript',  icon: <Code2        className="w-4 h-4" /> },
  { slug: 'typescript', label: 'TypeScript',  icon: <Code2        className="w-4 h-4" /> },
  { slug: 'python',     label: 'Python',      icon: <Code2        className="w-4 h-4" /> },
  { slug: 'ai',         label: 'AI / ML',     icon: <Brain        className="w-4 h-4" /> },
  { slug: 'frontend',   label: 'Web Dev',     icon: <Globe        className="w-4 h-4" /> },
  { slug: 'devtools',   label: 'DevOps',      icon: <Settings     className="w-4 h-4" /> },
  { slug: 'database',   label: 'Databases',   icon: <Database     className="w-4 h-4" /> },
  { slug: 'mobile',     label: 'Mobile',      icon: <Smartphone   className="w-4 h-4" /> },
]

export default function CategoryBrowser() {
  const [pendingCategory, setPendingCategory] = useState<string | null>(null)

  // Clear pending state after navigation (component re-renders on new page)
  useEffect(() => {
    // Small delay to show the spinner, then clear on unmount or re-render
    return () => setPendingCategory(null)
  }, [])

  const handleClick = (slug: string) => {
    setPendingCategory(slug)
  }

  return (
    <section className="px-4 pb-20 max-w-6xl mx-auto w-full">
      <h2 className="text-xl font-semibold text-[--color-text-primary] text-center mb-6">
        Browse by Category
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {CATEGORIES.map(cat => {
          const isPending = pendingCategory === cat.slug

          return (
            <Link
              key={cat.slug}
              to={`/category/${cat.slug}`}
              onClick={() => handleClick(cat.slug)}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                isPending
                  ? 'border-[--color-accent-blue] text-[--color-text-primary] bg-[--color-background-secondary]'
                  : 'border-[--color-border-default] text-[--color-text-secondary] hover:border-[--color-accent-blue] hover:text-[--color-text-primary]'
              }`}
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin text-[--color-accent-blue]" />
              ) : (
                <span className="text-[--color-text-muted]">{cat.icon}</span>
              )}
              {cat.label}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
