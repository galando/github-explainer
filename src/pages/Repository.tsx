import { useParams } from 'react-router'
import { useEffect } from 'react'
import { SEOHead } from '@/components/repo/SEOHead'
import { LoadingAnalysis } from '@/components/repo/LoadingAnalysis'
import { ProjectOverview } from '@/components/repo/ProjectOverview'
import { RepoOverview } from '@/components/repo/RepoOverview'
import { TechStack } from '@/components/repo/TechStack'
import { ArchitectureDiagram } from '@/components/repo/ArchitectureDiagram'
import { EntryPoints } from '@/components/repo/EntryPoints'
import { KeyFiles } from '@/components/repo/KeyFiles'
import { InstallationGuide } from '@/components/repo/InstallationGuide'
import { UsageExamples } from '@/components/repo/UsageExamples'
import { AIExplanation } from '@/components/repo/AIExplanation'
import { RepoStats } from '@/components/repo/RepoStats'
import { ShareCard } from '@/components/repo/ShareCard'
import { AskQuestion } from '@/components/repo/AskQuestion'
import { SmartComparison } from '@/components/repo/SmartComparison'
import { CommitActivity } from '@/components/repo/CommitActivity'
import { useGitHubAuth } from '@/hooks/useGitHubAuth'
import { useGitHubRepo } from '@/hooks/useGitHubRepo'
import { useRepoAnalysis } from '@/hooks/useRepoAnalysis'
import { parseReadme } from '@/services/readmeParser'
import { trackRepoViewed, detectAndTrackBadgeVisit } from '@/lib/analytics'

export default function Repository() {
  const { owner, repoName } = useParams<{ owner: string; repoName: string }>()
  useGitHubAuth()

  const { data: repoData, isLoading, error } = useGitHubRepo(owner ?? '', repoName ?? '')
  const { analysis, analysisError } = useRepoAnalysis(repoData)

  useEffect(() => {
    detectAndTrackBadgeVisit()
    if (owner && repoName) {
      trackRepoViewed(`${owner}/${repoName}`)
    }
  }, [owner, repoName])

  if (isLoading || (!analysis && !error && !analysisError)) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <LoadingAnalysis />
      </div>
    )
  }

  if (error || analysisError || !repoData || !analysis) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-2xl font-bold text-[--color-text-primary] mb-2">Repository not found</h2>
        <p className="text-[--color-text-secondary]">{error ?? analysisError ?? 'Could not load repository data.'}</p>
      </div>
    )
  }

  const readme = parseReadme(repoData.readme ?? '')
  const treeStats = {
    files: repoData.tree.filter(f => f.type === 'blob').length,
    folders: repoData.tree.filter(f => f.type === 'tree').length,
  }

  return (
    <>
      <SEOHead
        title={`${repoData.repo.full_name} — GitHub Explainer`}
        description={repoData.repo.description ?? `Understand ${repoData.repo.full_name} with AI.`}
        canonicalUrl={`${window.location.origin}/repo/${repoData.repo.full_name}`}
      />

      {/* Full-width repo header */}
      <div className="border-b border-[--color-border-default] bg-[--color-background]">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <ProjectOverview
            repo={repoData.repo}
            contributors={repoData.contributors}
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            <AIExplanation
              repoData={repoData}
              analysis={analysis}
              autoLoad
            />
            <RepoOverview repo={repoData.repo} analysis={analysis} />
            <ArchitectureDiagram tree={repoData.tree} />
            <EntryPoints
              entryPoints={analysis.entryPoints}
              repoUrl={repoData.repo.html_url}
              defaultBranch={repoData.repo.default_branch}
            />
            <KeyFiles
              keyFiles={analysis.keyFiles}
              repoUrl={repoData.repo.html_url}
              defaultBranch={repoData.repo.default_branch}
            />
            <InstallationGuide
              repo={repoData.repo}
              analysis={analysis}
              readme={readme}
            />
            <UsageExamples readme={readme} />
            <SmartComparison repo={repoData.repo} analysis={analysis} />
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <AskQuestion repoData={repoData} analysis={analysis} />
            <TechStack analysis={analysis} />
            <RepoStats
              repo={repoData.repo}
              analysis={analysis}
              treeStats={treeStats}
              contributorsCount={repoData.contributors.length}
            />
            <CommitActivity weeks={repoData.commitActivity} />
            <ShareCard repo={repoData.repo} />
          </div>
        </div>
      </div>
    </>
  )
}
