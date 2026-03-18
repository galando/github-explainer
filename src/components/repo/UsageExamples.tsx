import { useState } from 'react'
import { ParsedReadme } from '@/services/readmeParser'

interface UsageExamplesProps {
  readme: ParsedReadme | null
}

export function UsageExamples({ readme }: UsageExamplesProps) {
  const [copied, setCopied] = useState(false)

  if (!readme?.usage) return null

  const text = readme.usage.slice(0, 1000)

  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-[--color-background-secondary] rounded-xl border border-[--color-border-default] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[--color-text-primary]">Usage Examples</h3>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-xs text-[--color-text-secondary] hover:text-[--color-text-primary] transition-colors"
        >
          {copied ? (
            <>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 8l4 4 8-8" />
              </svg>
              Copied
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="4" width="9" height="10" rx="1" />
                <path d="M4 4V3a1 1 0 011-1h7a1 1 0 011 1v9a1 1 0 01-1 1h-1" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      <div className="prose prose-sm max-w-none text-[--color-text-secondary]">
        <pre className="whitespace-pre-wrap text-sm bg-[--color-background] p-4 rounded-lg overflow-x-auto">
          {text}
          {readme.usage.length > 1000 ? '\n...' : ''}
        </pre>
      </div>
    </div>
  )
}
