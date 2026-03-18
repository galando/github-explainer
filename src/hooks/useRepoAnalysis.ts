import { useState, useEffect } from 'react'
import { analyzeRepository, RepoAnalysis } from '@/services/repoAnalyzer'
import { RepoData } from './useGitHubRepo'

interface UseRepoAnalysisResult {
  analysis: RepoAnalysis | null
  isAnalyzing: boolean
  analysisError: string | null
}

export function useRepoAnalysis(repoData: RepoData | null): UseRepoAnalysisResult {
  const [analysis, setAnalysis] = useState<RepoAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  useEffect(() => {
    if (!repoData) return

    setIsAnalyzing(true)
    setAnalysisError(null)

    // Run analysis synchronously but defer to next tick so UI can render
    const timer = setTimeout(() => {
      try {
        const result = analyzeRepository(repoData)
        setAnalysis(result)
      } catch (err) {
        console.error('Analysis failed:', err)
        setAnalysisError('Could not analyze repository structure.')
      } finally {
        setIsAnalyzing(false)
      }
    }, 0)

    return () => clearTimeout(timer)
  }, [repoData])

  return { analysis, isAnalyzing, analysisError }
}
