import { useEffect } from 'react'
import { SEOHead } from '@/components/repo/SEOHead'
import { useGitHubAuth } from '@/hooks/useGitHubAuth'
import { trackPageView, detectAndTrackBadgeVisit } from '@/lib/analytics'
import HeroSection from '@/components/home/HeroSection'
import TrendingRepos from '@/components/home/TrendingRepos'

export default function Index() {
  useGitHubAuth()

  useEffect(() => {
    trackPageView('/')
    detectAndTrackBadgeVisit()
  }, [])

  return (
    <>
      <SEOHead
        title="GitHub Explainer — Understand Any GitHub Repo"
        description="Instantly understand any GitHub repository with AI-powered explanations of architecture, tech stack, and execution flow."
      />
      <div className="flex flex-col items-center">
        <HeroSection />
        <TrendingRepos />
      </div>
    </>
  )
}
