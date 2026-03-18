import { RepoData } from '@/hooks/useGitHubRepo'

export interface TechItem {
  name: string
  category: 'language' | 'framework' | 'library' | 'tool' | 'database' | 'cloud' | 'testing'
  confidence: 'high' | 'medium' | 'low'
  icon?: string
}

export interface ArchitecturePattern {
  name: string
  description: string
  evidence: string[]
}

export interface EntryPoint {
  path: string
  description: string
  type: 'main' | 'config' | 'test' | 'docs' | 'ci'
}

export interface RepoAnalysis {
  techStack: TechItem[]
  architecture: ArchitecturePattern[]
  entryPoints: EntryPoint[]
  packageManager: string | null
  testingFrameworks: string[]
  cicd: string[]
  keyFiles: { path: string; reason: string }[]
  complexity: 'simple' | 'moderate' | 'complex'
  primaryLanguage: string | null
  languageBreakdown: { language: string; percentage: number; bytes: number }[]
}

// --- Detection helpers ---

function hasFile(tree: { path: string }[], ...paths: string[]): boolean {
  return paths.some(p => tree.some(f => f.path === p || f.path.endsWith('/' + p)))
}

function hasFileMatching(tree: { path: string }[], pattern: RegExp): boolean {
  return tree.some(f => pattern.test(f.path))
}

function countFiles(tree: { path: string }[], pattern: RegExp): number {
  return tree.filter(f => pattern.test(f.path)).length
}

// --- Framework detection from file tree ---

function detectFrameworks(tree: { path: string; type: string }[]): TechItem[] {
  const items: TechItem[] = []
  const files = tree.map(f => f.path)

  // React
  if (files.some(f => /\.(tsx|jsx)$/.test(f))) {
    items.push({ name: 'React', category: 'framework', confidence: 'high' })
  }

  // Vue
  if (files.some(f => f.endsWith('.vue'))) {
    items.push({ name: 'Vue.js', category: 'framework', confidence: 'high' })
  }

  // Angular
  if (hasFile(tree, 'angular.json', '.angular-cli.json') || files.some(f => f.includes('.component.ts'))) {
    items.push({ name: 'Angular', category: 'framework', confidence: 'high' })
  }

  // Svelte
  if (files.some(f => f.endsWith('.svelte'))) {
    items.push({ name: 'Svelte', category: 'framework', confidence: 'high' })
  }

  // Next.js
  if (hasFile(tree, 'next.config.js', 'next.config.ts', 'next.config.mjs')) {
    items.push({ name: 'Next.js', category: 'framework', confidence: 'high' })
  }

  // Nuxt
  if (hasFile(tree, 'nuxt.config.ts', 'nuxt.config.js')) {
    items.push({ name: 'Nuxt.js', category: 'framework', confidence: 'high' })
  }

  // Vite
  if (hasFile(tree, 'vite.config.ts', 'vite.config.js', 'vite.config.mjs')) {
    items.push({ name: 'Vite', category: 'tool', confidence: 'high' })
  }

  // Spring Boot
  if (hasFile(tree, 'pom.xml') || files.some(f => f.includes('Application.java') || f.includes('SpringBoot'))) {
    items.push({ name: 'Spring Boot', category: 'framework', confidence: 'high' })
  }

  // Django
  if (hasFile(tree, 'manage.py', 'django.py', 'wsgi.py', 'asgi.py')) {
    items.push({ name: 'Django', category: 'framework', confidence: 'high' })
  }

  // FastAPI
  if (files.some(f => f.includes('main.py') || f.includes('app.py')) && files.some(f => f.endsWith('.py'))) {
    // Check if likely FastAPI by presence of requirements.txt with fastapi
    items.push({ name: 'Python Web App', category: 'framework', confidence: 'low' })
  }

  // Express / Node
  if (hasFile(tree, 'server.js', 'server.ts', 'app.js', 'app.ts', 'index.js', 'index.ts') &&
      files.some(f => f.endsWith('.js') || f.endsWith('.ts'))) {
    items.push({ name: 'Node.js', category: 'framework', confidence: 'medium' })
  }

  // Laravel
  if (hasFile(tree, 'artisan') || files.some(f => f.includes('/app/Http/Controllers'))) {
    items.push({ name: 'Laravel', category: 'framework', confidence: 'high' })
  }

  // Ruby on Rails
  if (hasFile(tree, 'Gemfile', 'config/routes.rb') || files.some(f => f.includes('app/controllers'))) {
    items.push({ name: 'Ruby on Rails', category: 'framework', confidence: 'high' })
  }

  // Flutter
  if (hasFile(tree, 'pubspec.yaml') && files.some(f => f.endsWith('.dart'))) {
    items.push({ name: 'Flutter', category: 'framework', confidence: 'high' })
  }

  // Electron
  if (hasFile(tree, 'electron-builder.yml', 'electron.js', 'electron.ts')) {
    items.push({ name: 'Electron', category: 'framework', confidence: 'high' })
  }

  // Tailwind CSS
  if (hasFile(tree, 'tailwind.config.js', 'tailwind.config.ts', 'tailwind.config.cjs')) {
    items.push({ name: 'TailwindCSS', category: 'library', confidence: 'high' })
  }

  // Dockerfile / containers
  if (hasFile(tree, 'Dockerfile', 'docker-compose.yml', 'docker-compose.yaml')) {
    items.push({ name: 'Docker', category: 'tool', confidence: 'high' })
  }

  // Kubernetes
  if (files.some(f => f.includes('k8s/') || f.includes('kubernetes/') || f.endsWith('.yaml') && f.includes('deploy'))) {
    items.push({ name: 'Kubernetes', category: 'cloud', confidence: 'medium' })
  }

  // Terraform
  if (files.some(f => f.endsWith('.tf'))) {
    items.push({ name: 'Terraform', category: 'tool', confidence: 'high' })
  }

  // GitHub Actions
  if (files.some(f => f.startsWith('.github/workflows/'))) {
    items.push({ name: 'GitHub Actions', category: 'tool', confidence: 'high' })
  }

  return items
}

function detectPackageManager(tree: { path: string }[]): string | null {
  if (hasFile(tree, 'pnpm-lock.yaml')) return 'pnpm'
  if (hasFile(tree, 'yarn.lock')) return 'yarn'
  if (hasFile(tree, 'bun.lockb')) return 'bun'
  if (hasFile(tree, 'package-lock.json')) return 'npm'
  if (hasFile(tree, 'Cargo.lock', 'Cargo.toml')) return 'cargo'
  if (hasFile(tree, 'go.mod')) return 'go modules'
  if (hasFile(tree, 'requirements.txt', 'poetry.lock', 'Pipfile')) {
    if (hasFile(tree, 'poetry.lock')) return 'poetry'
    if (hasFile(tree, 'Pipfile')) return 'pipenv'
    return 'pip'
  }
  if (hasFile(tree, 'Gemfile.lock')) return 'bundler'
  if (hasFile(tree, 'pom.xml')) return 'maven'
  if (hasFile(tree, 'build.gradle', 'build.gradle.kts')) return 'gradle'
  if (hasFile(tree, 'pubspec.yaml')) return 'pub'
  return null
}

function detectTestingFrameworks(tree: { path: string }[]): string[] {
  const frameworks: string[] = []
  const files = tree.map(f => f.path)

  if (hasFile(tree, 'jest.config.js', 'jest.config.ts', 'jest.config.cjs')) frameworks.push('Jest')
  if (files.some(f => f.includes('.test.') || f.includes('.spec.'))) {
    if (!frameworks.includes('Jest')) frameworks.push('Jest (likely)')
  }
  if (hasFile(tree, 'vitest.config.ts', 'vitest.config.js')) frameworks.push('Vitest')
  if (hasFile(tree, 'cypress.config.ts', 'cypress.config.js') || files.some(f => f.includes('/cypress/'))) {
    frameworks.push('Cypress')
  }
  if (hasFile(tree, 'playwright.config.ts', 'playwright.config.js')) frameworks.push('Playwright')
  if (files.some(f => f.includes('_test.go') || f.includes('_test.py'))) {
    if (files.some(f => f.endsWith('.go'))) frameworks.push('Go testing')
    if (files.some(f => f.endsWith('.py'))) frameworks.push('pytest')
  }
  if (files.some(f => f.includes('Test.java') || f.includes('test/'))) {
    if (hasFile(tree, 'pom.xml')) frameworks.push('JUnit')
  }
  if (hasFile(tree, 'rspec', '.rspec') || files.some(f => f.includes('_spec.rb'))) {
    frameworks.push('RSpec')
  }

  return frameworks
}

function detectCICD(tree: { path: string }[]): string[] {
  const ci: string[] = []

  if (tree.some(f => f.path.startsWith('.github/workflows/'))) ci.push('GitHub Actions')
  if (hasFile(tree, '.travis.yml')) ci.push('Travis CI')
  if (hasFile(tree, '.circleci/config.yml', 'circle.yml')) ci.push('CircleCI')
  if (hasFile(tree, 'Jenkinsfile', '.jenkins')) ci.push('Jenkins')
  if (hasFile(tree, '.gitlab-ci.yml')) ci.push('GitLab CI')
  if (hasFile(tree, 'azure-pipelines.yml')) ci.push('Azure Pipelines')
  if (hasFile(tree, 'bitbucket-pipelines.yml')) ci.push('Bitbucket Pipelines')
  if (hasFile(tree, 'vercel.json')) ci.push('Vercel')
  if (hasFile(tree, 'netlify.toml', '_redirects')) ci.push('Netlify')

  return ci
}

function detectArchitecture(
  tree: { path: string; type: string }[],
  languages: Record<string, number>
): ArchitecturePattern[] {
  const patterns: ArchitecturePattern[] = []
  const files = tree.map(f => f.path)
  const dirs = tree.filter(f => f.type === 'tree').map(f => f.path)

  // Monorepo
  if (hasFile(tree, 'lerna.json', 'nx.json', 'turbo.json', 'pnpm-workspace.yaml', 'rush.json')) {
    patterns.push({
      name: 'Monorepo',
      description: 'Multiple packages managed in a single repository',
      evidence: ['lerna.json / nx.json / turbo.json detected'],
    })
  }

  // MVC
  const hasMVC =
    dirs.some(d => /\/(models?|controllers?|views?)$/.test(d)) ||
    files.some(f => /\/(models?|controllers?|views?)\//.test(f))
  if (hasMVC) {
    patterns.push({
      name: 'MVC',
      description: 'Model-View-Controller architecture separating concerns',
      evidence: ['models/, controllers/, views/ directories found'],
    })
  }

  // Microservices
  const serviceCount = dirs.filter(d => /\/(service|svc|microservice)/.test(d)).length
  if (serviceCount >= 2 || (hasFile(tree, 'docker-compose.yml') && dirs.some(d => /services?/.test(d)))) {
    patterns.push({
      name: 'Microservices',
      description: 'Application split into independently deployable services',
      evidence: [`${serviceCount} service directories found`],
    })
  }

  // Feature-based (common in React apps)
  const featureDirs = dirs.filter(d => /\/features\//.test(d) || /\/modules\//.test(d))
  if (featureDirs.length >= 2) {
    patterns.push({
      name: 'Feature-based architecture',
      description: 'Code organized by business feature rather than file type',
      evidence: [`${featureDirs.length} feature/module directories found`],
    })
  }

  // Layered (src/domain, src/application, src/infrastructure)
  const layeredDirs = dirs.filter(d =>
    /\/(domain|application|infrastructure|presentation|adapter)/.test(d)
  )
  if (layeredDirs.length >= 2) {
    patterns.push({
      name: 'Layered (Clean) Architecture',
      description: 'Clear separation between domain, application, and infrastructure layers',
      evidence: layeredDirs.slice(0, 3).map(d => d),
    })
  }

  // CLI tool
  const cliFiles = files.filter(f => /\/(bin|cmd|cli)\//.test(f) || f === 'bin/cli' || f.endsWith('/cli.ts'))
  if (cliFiles.length >= 1) {
    patterns.push({
      name: 'CLI Tool',
      description: 'Command-line application with bin/cmd entry points',
      evidence: cliFiles.slice(0, 2),
    })
  }

  // API / REST
  const apiDirs = dirs.filter(d => /\/(api|routes?|endpoints?|handlers?)/.test(d))
  if (apiDirs.length >= 1 || files.some(f => /router|routes/.test(f))) {
    patterns.push({
      name: 'REST API',
      description: 'HTTP API with structured routing',
      evidence: apiDirs.slice(0, 2),
    })
  }

  // Library / Package
  const isLib =
    hasFile(tree, 'index.ts', 'index.js', 'lib/index.ts', 'src/index.ts') &&
    !hasFile(tree, 'src/App.tsx', 'src/App.jsx', 'src/main.tsx')
  if (isLib) {
    patterns.push({
      name: 'Library / Package',
      description: 'Reusable code package meant to be imported by other projects',
      evidence: ['index file at root, no app entry point'],
    })
  }

  return patterns
}

function detectKeyFiles(tree: { path: string; type: string }[]): { path: string; reason: string }[] {
  const key: { path: string; reason: string }[] = []
  const blobs = tree.filter(f => f.type === 'blob').map(f => f.path)

  const checks: [string, string][] = [
    ['package.json', 'Node.js dependencies and scripts'],
    ['pom.xml', 'Maven build configuration'],
    ['build.gradle', 'Gradle build configuration'],
    ['Cargo.toml', 'Rust crate manifest'],
    ['go.mod', 'Go module definition'],
    ['requirements.txt', 'Python dependencies'],
    ['pyproject.toml', 'Python project configuration'],
    ['Gemfile', 'Ruby dependencies'],
    ['pubspec.yaml', 'Flutter/Dart dependencies'],
    ['docker-compose.yml', 'Multi-container Docker setup'],
    ['Dockerfile', 'Container image definition'],
    ['.env.example', 'Required environment variables'],
    ['README.md', 'Project documentation'],
    ['CONTRIBUTING.md', 'Contribution guide'],
    ['CHANGELOG.md', 'Version history'],
    ['LICENSE', 'License information'],
  ]

  for (const [file, reason] of checks) {
    if (blobs.some(b => b === file || b.toLowerCase() === file.toLowerCase())) {
      key.push({ path: file, reason })
    }
  }

  // Config files
  for (const b of blobs) {
    if (
      (b.endsWith('.config.ts') || b.endsWith('.config.js')) &&
      !key.some(k => k.path === b)
    ) {
      key.push({ path: b, reason: 'Build/framework configuration' })
    }
    if (b.includes('schema') && (b.endsWith('.sql') || b.endsWith('.prisma'))) {
      key.push({ path: b, reason: 'Database schema' })
    }
  }

  return key.slice(0, 12)
}

function detectEntryPoints(tree: { path: string; type: string }[]): EntryPoint[] {
  const entries: EntryPoint[] = []
  const blobs = tree.filter(f => f.type === 'blob').map(f => f.path)

  const mainCandidates: [string, string][] = [
    ['src/main.tsx', 'React application entry point'],
    ['src/main.ts', 'Application entry point'],
    ['src/index.tsx', 'React application entry point'],
    ['src/index.ts', 'Application entry point'],
    ['src/App.tsx', 'Root React component'],
    ['main.go', 'Go application entry point'],
    ['main.py', 'Python entry point'],
    ['app.py', 'Python application'],
    ['manage.py', 'Django management CLI'],
    ['src/main.rs', 'Rust binary entry point'],
    ['index.js', 'Node.js entry point'],
    ['server.js', 'Node.js server'],
    ['server.ts', 'TypeScript server'],
    ['app/main.dart', 'Flutter entry point'],
  ]

  for (const [path, description] of mainCandidates) {
    if (blobs.includes(path)) {
      entries.push({ path, description, type: 'main' })
    }
  }

  // Config files
  const configPatterns: [RegExp, string][] = [
    [/^(vite|webpack|rollup|esbuild|next|nuxt)\.config\.(ts|js|mjs)$/, 'Build configuration'],
    [/^(jest|vitest|playwright|cypress)\.config\.(ts|js)$/, 'Test configuration'],
    [/^\.github\/workflows\/.+\.ya?ml$/, 'CI/CD workflow'],
  ]

  for (const b of blobs) {
    for (const [pattern, description] of configPatterns) {
      if (pattern.test(b) && !entries.some(e => e.path === b)) {
        entries.push({
          path: b,
          description,
          type: b.includes('test') || b.includes('jest') || b.includes('vitest') ? 'test' : 'config',
        })
      }
    }
  }

  return entries.slice(0, 10)
}

function calculateComplexity(
  tree: { path: string }[],
  languages: Record<string, number>
): 'simple' | 'moderate' | 'complex' {
  const fileCount = tree.length
  const langCount = Object.keys(languages).length
  const totalBytes = Object.values(languages).reduce((a, b) => a + b, 0)

  if (fileCount > 500 || totalBytes > 5_000_000 || langCount > 8) return 'complex'
  if (fileCount > 100 || totalBytes > 500_000 || langCount > 4) return 'moderate'
  return 'simple'
}

function computeLanguageBreakdown(
  languages: Record<string, number>
): { language: string; percentage: number; bytes: number }[] {
  const total = Object.values(languages).reduce((a, b) => a + b, 0)
  if (total === 0) return []

  return Object.entries(languages)
    .map(([language, bytes]) => ({
      language,
      bytes,
      percentage: Math.round((bytes / total) * 100),
    }))
    .sort((a, b) => b.bytes - a.bytes)
}

// --- Main export ---

export function analyzeRepository(repoData: RepoData): RepoAnalysis {
  const { tree, languages, repo } = repoData

  const langBreakdown = computeLanguageBreakdown(languages)
  const primaryLanguage = langBreakdown[0]?.language ?? repo.language ?? null

  // Add languages to tech stack
  const techFromLanguages: TechItem[] = langBreakdown.slice(0, 5).map(l => ({
    name: l.language,
    category: 'language' as const,
    confidence: 'high' as const,
  }))

  const frameworkItems = detectFrameworks(tree)
  const packageManager = detectPackageManager(tree)
  const testingFrameworks = detectTestingFrameworks(tree)
  const cicd = detectCICD(tree)
  const architecture = detectArchitecture(tree, languages)
  const keyFiles = detectKeyFiles(tree)
  const entryPoints = detectEntryPoints(tree)
  const complexity = calculateComplexity(tree, languages)

  // Add testing tools to tech stack
  const techFromTesting: TechItem[] = testingFrameworks.map(t => ({
    name: t,
    category: 'testing' as const,
    confidence: 'medium' as const,
  }))

  // Add CI tools
  const techFromCI: TechItem[] = cicd.map(c => ({
    name: c,
    category: 'tool' as const,
    confidence: 'high' as const,
  }))

  // Package manager tool
  const pmTech: TechItem[] = packageManager
    ? [{ name: packageManager, category: 'tool', confidence: 'high' }]
    : []

  // Deduplicate
  const allTech = [
    ...techFromLanguages,
    ...frameworkItems,
    ...pmTech,
    ...techFromTesting,
    ...techFromCI,
  ]
  const seen = new Set<string>()
  const techStack = allTech.filter(t => {
    if (seen.has(t.name)) return false
    seen.add(t.name)
    return true
  })

  return {
    techStack,
    architecture,
    entryPoints,
    packageManager,
    testingFrameworks,
    cicd,
    keyFiles,
    complexity,
    primaryLanguage,
    languageBreakdown: langBreakdown,
  }
}
