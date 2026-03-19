import { useState } from 'react'
import { GitHubRepo } from '@/services/github'
import { RepoAnalysis } from '@/services/repoAnalyzer'
import { ParsedReadme } from '@/services/readmeParser'

interface InstallationGuideProps {
  repo: GitHubRepo
  analysis: RepoAnalysis
  readme: ParsedReadme | null
}

function getInstallCommands(repo: GitHubRepo, analysis: RepoAnalysis): string[] {
  const { packageManager, entryPoints } = analysis
  const { full_name, default_branch } = repo

  const lines: string[] = []
  lines.push(`git clone https://github.com/${full_name}.git`)
  lines.push(`cd ${repo.name}`)

  if (packageManager === 'npm') {
    lines.push('npm install')
    lines.push('npm run dev')
  } else if (packageManager === 'pnpm') {
    lines.push('pnpm install')
    lines.push('pnpm dev')
  } else if (packageManager === 'yarn') {
    lines.push('yarn install')
    lines.push('yarn dev')
  } else if (packageManager === 'bun') {
    lines.push('bun install')
    lines.push('bun dev')
  } else if (packageManager === 'pip' || packageManager === 'poetry' || packageManager === 'pipenv') {
    if (packageManager === 'poetry') {
      lines.push('poetry install')
      lines.push('poetry run python main.py')
    } else {
      lines.push('pip install -r requirements.txt')
      const main = entryPoints.find(e => e.path.endsWith('.py'))
      lines.push(`python ${main?.path ?? 'main.py'}`)
    }
  } else if (packageManager === 'cargo') {
    lines.push('cargo build')
    lines.push('cargo run')
  } else if (packageManager === 'go modules') {
    lines.push('go mod download')
    lines.push('go run .')
  } else if (packageManager === 'maven') {
    lines.push('mvn install')
    lines.push('mvn spring-boot:run')
  } else if (packageManager === 'gradle') {
    lines.push('./gradlew build')
    lines.push('./gradlew bootRun')
  } else {
    lines.push('# Install dependencies according to your package manager')
  }

  return lines
}

export function InstallationGuide({ repo, analysis, readme }: InstallationGuideProps) {
  const [copied, setCopied] = useState(false)
  const commands = getInstallCommands(repo, analysis)
  const text = commands.join('\n')

  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-[--color-background-secondary] rounded-xl border border-[--color-border-default] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[--color-text-primary]">Quick Start</h3>
        <button
          onClick={copy}
          className="text-xs text-[--color-text-secondary] hover:text-[--color-text-secondary] flex items-center gap-1"
        >
          {copied ? '✅ Copied' : '📋 Copy'}
        </button>
      </div>

      <pre className="bg-[--color-background] text-[--color-text-secondary] rounded-lg p-4 text-sm overflow-x-auto">
        <code>{commands.map(cmd => `$ ${cmd}`).join('\n')}</code>
      </pre>

      {readme?.installation && (
        <div className="mt-4 pt-4 border-t border-[--color-border-default]">
          <p className="text-sm font-medium text-[--color-text-secondary] mb-2">From README</p>
          <div className="prose prose-sm max-w-none text-[--color-text-secondary]">
            <pre className="whitespace-pre-wrap text-xs bg-[--color-background] p-3 rounded overflow-x-auto">
              {readme.installation.slice(0, 800)}
              {readme.installation.length > 800 ? '\n...' : ''}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
