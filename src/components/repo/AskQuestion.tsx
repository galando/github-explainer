import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { RepoData } from '@/hooks/useGitHubRepo'
import { RepoAnalysis } from '@/services/repoAnalyzer'
import { trackExplanationRequested } from '@/lib/analytics'

interface AskQuestionProps {
  repoData: RepoData
  analysis: RepoAnalysis
}

function getSuggestedQuestions(repoName: string): string[] {
  const name = repoName.split('/').pop() ?? repoName
  return [
    `What is ${name} used for?`,
    `How do I contribute to ${name}?`,
    `What are the main dependencies?`,
  ]
}

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2L8 8" />
    <path d="M14 2L9.5 14l-3-5-5-3L14 2z" />
  </svg>
)

export function AskQuestion({ repoData, analysis }: AskQuestionProps) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const suggestedQuestions = getSuggestedQuestions(repoData.repo.full_name)

  // Press "/" anywhere on page to focus the input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return
      if (e.key === '/') {
        e.preventDefault()
        if (collapsed) setCollapsed(false)
        setTimeout(() => inputRef.current?.focus(), 50)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [collapsed])

  const ask = async (q?: string) => {
    const text = (q ?? question).trim()
    if (!text || isLoading) return

    if (q) setQuestion(q)

    setIsLoading(true)
    setError('')
    setAnswer('')

    try {
      trackExplanationRequested(repoData.repo.full_name, 'question')

      const context = {
        repoName: repoData.repo.full_name,
        description: repoData.repo.description,
        language: analysis.primaryLanguage,
        techStack: analysis.techStack.map(t => t.name).join(', '),
        architecture: analysis.architecture.map(a => a.name).join(', '),
        question: text,
      }

      const { data, error: fnError } = await supabase.functions.invoke('explain-code', {
        body: {
          type: 'question',
          content: text,
          context,
        },
      })

      if (fnError) throw fnError
      setAnswer(data?.explanation ?? 'No answer received.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get answer. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-[--color-background-secondary] rounded-xl border border-[--color-border-default] p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-[--color-text-primary]">Ask About This Repository</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[--color-text-muted] bg-[--color-background] border border-[--color-border-default] px-1.5 py-0.5 rounded font-mono">/</span>
          <button
            onClick={() => setCollapsed(c => !c)}
            className="text-xs text-[--color-text-muted] hover:text-[--color-text-secondary] transition-colors"
          >
            {collapsed ? 'Expand' : 'Collapse'}
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Suggested questions */}
          {!answer && (
            <div className="mb-3">
              <p className="text-xs text-[--color-text-muted] mb-2">Suggested questions:</p>
              <div className="space-y-1">
                {suggestedQuestions.map(q => (
                  <button
                    key={q}
                    onClick={() => ask(q)}
                    disabled={isLoading}
                    className="block w-full text-left text-sm text-[--color-text-secondary] hover:text-[--color-accent-blue] transition-colors py-0.5"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Answer area */}
          {error && (
            <p className="text-sm text-red-400 mb-3">{error}</p>
          )}
          {answer && (
            <div className="prose prose-sm max-w-none p-3 bg-[--color-background] rounded-lg text-[--color-text-secondary] whitespace-pre-wrap text-sm mb-3 leading-relaxed">
              {answer}
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && ask()}
              placeholder="Ask a question... (press / to focus)"
              className="flex-1 px-3 py-2 bg-[--color-background] rounded-lg border border-[--color-border-default] text-sm text-[--color-text-primary] placeholder:text-[--color-text-muted] focus:outline-none focus:ring-1 focus:ring-[--color-accent-blue]"
            />
            <button
              onClick={() => ask()}
              disabled={isLoading || !question.trim()}
              className="p-2 bg-[--color-btn-primary-bg] text-white rounded-lg hover:bg-[--color-btn-primary-hover] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Ask"
            >
              {isLoading
                ? <span className="w-4 h-4 block border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <SendIcon />
              }
            </button>
          </div>
        </>
      )}
    </div>
  )
}
