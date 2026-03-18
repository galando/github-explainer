import { useParams } from 'react-router'
import { useEffect } from 'react'
import { SEOHead } from '@/components/repo/SEOHead'
import { AIExplanation } from '@/components/repo/AIExplanation'
import { LoadingAnalysis } from '@/components/repo/LoadingAnalysis'
import { useGitHubRepo } from '@/hooks/useGitHubRepo'
import { useRepoAnalysis } from '@/hooks/useRepoAnalysis'
import { useGitHubAuth } from '@/hooks/useGitHubAuth'
import { trackPageView } from '@/lib/analytics'

// Canonical slug overrides for SEO-friendly URLs
const REPO_SLUGS: Record<string, { owner: string; repo: string }> = {
  react:      { owner: 'facebook',     repo: 'react' },
  nextjs:     { owner: 'vercel',       repo: 'next.js' },
  vue:        { owner: 'vuejs',        repo: 'vue' },
  angular:    { owner: 'angular',      repo: 'angular' },
  svelte:     { owner: 'sveltejs',     repo: 'svelte' },
  vite:       { owner: 'vitejs',       repo: 'vite' },
  tailwind:   { owner: 'tailwindlabs', repo: 'tailwindcss' },
  supabase:   { owner: 'supabase',     repo: 'supabase' },
  prisma:     { owner: 'prisma',       repo: 'prisma' },
  trpc:       { owner: 'trpc',         repo: 'trpc' },
  astro:      { owner: 'withastro',    repo: 'astro' },
  remix:      { owner: 'remix-run',    repo: 'remix' },
  shadcn:     { owner: 'shadcn-ui',    repo: 'ui' },
}

export default function Explain() {
  const { owner: ownerParam, repoName: repoParam } = useParams<{ owner: string; repoName: string }>()
  useGitHubAuth()

  // Resolve slug or use direct owner/repo
  const slug = ownerParam ?? ''
  const resolved = REPO_SLUGS[slug]
  const owner = resolved ? resolved.owner : ownerParam ?? ''
  const repoName = resolved ? resolved.repo : repoParam ?? ''

  const { data: repoData, isLoading, error } = useGitHubRepo(owner, repoName)
  const { analysis } = useRepoAnalysis(repoData)

  useEffect(() => {
    trackPageView(`/explain/${owner}/${repoName}`)
  }, [owner, repoName])

  return (
    <>
      <SEOHead
        title={`${owner}/${repoName} Explained — GitHub Explainer`}
        description={`AI explanation of ${owner}/${repoName}: architecture, tech stack, and how it works.`}
        canonicalUrl={`${window.location.origin}/explain/${owner}/${repoName}`}
      />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {isLoading || (!analysis && !error) ? (
          <LoadingAnalysis />
        ) : error || !repoData || !analysis ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold text-[--color-text-primary] mb-2">Repository not found</h2>
            <p className="text-[--color-text-secondary]">{error ?? 'Could not load repository data.'}</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-[--color-text-primary]">
                {repoData.repo.full_name}
              </h1>
              {repoData.repo.description && (
                <p className="text-[--color-text-secondary] mt-2">{repoData.repo.description}</p>
              )}
            </div>
            <AIExplanation
              repoData={repoData}
              analysis={analysis}
              autoLoad
            />
          </>
        )}
      </div>
    </>
  )
}
