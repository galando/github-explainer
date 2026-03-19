import { useParams } from 'react-router'
import { useState, useEffect } from 'react'
import { githubService, GitHubRepo } from '@/services/github'
import { analyzeRepository } from '@/services/repoAnalyzer'
import { useGitHubRepo } from '@/hooks/useGitHubRepo'
import { TechStack } from '@/components/repo/TechStack'
import { RepoStats } from '@/components/repo/RepoStats'

// URL format: /compare/owner1:repo1...owner2:repo2
function parseRepos(param: string): { owner: string; name: string }[] {
  return param
    .split('...')
    .slice(0, 3)
    .map(part => {
      const [owner, name] = part.split(':')
      return { owner: owner ?? '', name: name ?? '' }
    })
    .filter(r => r.owner && r.name)
}

function RepoColumn({ owner, name }: { owner: string; name: string }) {
  const { data, isLoading, error } = useGitHubRepo(owner, name)

  const analysis = data
    ? analyzeRepository(data)
    : null

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-[--color-background-secondary] rounded-xl animate-pulse" />
        <div className="h-48 bg-[--color-background-secondary] rounded-xl animate-pulse" />
        <div className="h-48 bg-[--color-background-secondary] rounded-xl animate-pulse" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-900/20 rounded-xl border border-red-800 text-red-400 text-sm">
        {error ?? 'Failed to load'}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-[--color-background-secondary] rounded-xl border border-[--color-border-default]">
        <p className="text-xs text-[--color-text-muted]">{data.repo.owner.login}</p>
        <p className="font-bold text-xl text-[--color-text-primary]">{data.repo.name}</p>
        {data.repo.description && (
          <p className="text-sm text-[--color-text-secondary] mt-1">{data.repo.description}</p>
        )}
      </div>
      <RepoStats repo={data.repo} />
      {analysis && <TechStack analysis={analysis} />}
    </div>
  )
}

export default function Comparison() {
  const { repos } = useParams<{ repos: string }>()
  const repoList = parseRepos(repos ?? '')

  if (repoList.length < 2) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-[--color-text-primary] mb-2">Invalid comparison URL</h2>
        <p className="text-[--color-text-secondary]">Use format: /compare/owner1:repo1...owner2:repo2</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-[--color-text-primary] mb-8">Repository Comparison</h1>
      <div className={`grid gap-6 ${repoList.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {repoList.map(r => (
          <RepoColumn key={`${r.owner}/${r.name}`} owner={r.owner} name={r.name} />
        ))}
      </div>
    </div>
  )
}
