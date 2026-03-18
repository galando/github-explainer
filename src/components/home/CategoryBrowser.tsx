import { Link } from 'react-router'
import { Code2, Brain, Globe, Settings, Database, Smartphone, GitBranch, Shield } from 'lucide-react'

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
  return (
    <section className="px-4 pb-20 max-w-6xl mx-auto w-full">
      <h2 className="text-xl font-semibold text-[--color-text-primary] text-center mb-6">
        Browse by Category
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {CATEGORIES.map(cat => (
          <Link
            key={cat.slug}
            to={`/category/${cat.slug}`}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[--color-border-default] text-[--color-text-secondary] text-sm font-medium hover:border-[--color-accent-blue] hover:text-[--color-text-primary] transition-colors"
          >
            <span className="text-[--color-text-muted]">{cat.icon}</span>
            {cat.label}
          </Link>
        ))}
      </div>
    </section>
  )
}
