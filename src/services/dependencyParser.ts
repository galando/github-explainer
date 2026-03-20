export interface Dependency {
  name: string
  version: string | null
  isDev: boolean
  category: 'core' | 'testing' | 'build' | 'framework' | 'utility'
}

export interface ParsedManifest {
  type: ManifestType
  dependencies: Dependency[]
  scripts?: Record<string, string>
  engines?: Record<string, string>
}

export type ManifestType =
  | 'package.json'
  | 'requirements.txt'
  | 'pyproject.toml'
  | 'Cargo.toml'
  | 'go.mod'
  | 'pom.xml'
  | 'build.gradle'
  | 'build.gradle.kts'
  | 'Gemfile'
  | 'composer.json'
  | 'pubspec.yaml'

// Known package categories for accurate classification
const PACKAGE_CATEGORIES: Record<string, Dependency['category']> = {
  // Frameworks
  'react': 'framework',
  'react-dom': 'framework',
  'vue': 'framework',
  'vue-router': 'framework',
  'angular': 'framework',
  '@angular/core': 'framework',
  '@angular/common': 'framework',
  '@angular/router': 'framework',
  'next': 'framework',
  'next.js': 'framework',
  'nuxt': 'framework',
  'nuxtjs': 'framework',
  'express': 'framework',
  'express.js': 'framework',
  'fastify': 'framework',
  'koa': 'framework',
  'hapi': 'framework',
  'nestjs': 'framework',
  '@nestjs/core': 'framework',
  'django': 'framework',
  'flask': 'framework',
  'fastapi': 'framework',
  'tornado': 'framework',
  'spring-boot': 'framework',
  'spring-boot-starter-web': 'framework',
  'actix-web': 'framework',
  'rocket': 'framework',
  'axum': 'framework',
  'gin': 'framework',
  'echo': 'framework',
  'fiber': 'framework',
  'rails': 'framework',
  'sinatra': 'framework',
  'laravel': 'framework',
  'symfony': 'framework',
  'svelte': 'framework',
  'sveltekit': 'framework',
  'solid-js': 'framework',
  'solidjs': 'framework',
  'astro': 'framework',
  'remix': 'framework',
  '@remix-run/react': 'framework',
  'gatsby': 'framework',
  'gatsby-plugin-image': 'framework',

  // Testing
  'jest': 'testing',
  'vitest': 'testing',
  'cypress': 'testing',
  'playwright': 'testing',
  '@playwright/test': 'testing',
  'pytest': 'testing',
  'pytest-asyncio': 'testing',
  'unittest': 'testing',
  'junit': 'testing',
  'junit-jupiter': 'testing',
  'mocha': 'testing',
  'chai': 'testing',
  '@testing-library/react': 'testing',
  '@testing-library/jest-dom': 'testing',
  '@testing-library/user-event': 'testing',
  'testing-library': 'testing',
  'jasmine': 'testing',
  'karma': 'testing',
  'ava': 'testing',
  'tap': 'testing',
  'rspec': 'testing',
  'phpunit': 'testing',
  'pest': 'testing',
  'mockito': 'testing',
  'testify': 'testing',
  'cargo-test': 'testing',

  // Build tools
  'webpack': 'build',
  'webpack-cli': 'build',
  'vite': 'build',
  '@vitejs/plugin-react': 'build',
  'esbuild': 'build',
  'rollup': 'build',
  'turbo': 'build',
  'nx': 'build',
  '@nx/workspace': 'build',
  'parcel': 'build',
  'snowpack': 'build',
  'swc': 'build',
  '@swc/core': 'build',
  'babel': 'build',
  '@babel/core': 'build',
  'typescript': 'build',
  'ts-node': 'build',
  'tsc': 'build',
  'terser': 'build',
  'gulp': 'build',
  'grunt': 'build',
  'browserify': 'build',
  'shadow-cljs': 'build',
  'gradle': 'build',
  'maven': 'build',
  'cargo': 'build',
  'pip': 'build',
  'poetry': 'build',
  'pipenv': 'build',

  // Bundlers & Compilers
  'sass': 'build',
  'scss': 'build',
  'postcss': 'build',
  'autoprefixer': 'build',
  'less': 'build',
  'stylus': 'build',
  'tailwindcss': 'build',
  '@tailwindcss/vite': 'build',

  // Core/Utility (default fallback for common libs)
  'lodash': 'utility',
  'underscore': 'utility',
  'axios': 'utility',
  'fetch': 'utility',
  'node-fetch': 'utility',
  'got': 'utility',
  'superagent': 'utility',
  'moment': 'utility',
  'dayjs': 'utility',
  'date-fns': 'utility',
  'luxon': 'utility',
  'ramda': 'utility',
  'immutable': 'utility',
  'zod': 'utility',
  'yup': 'utility',
  'joi': 'utility',
  'ajv': 'utility',
  'uuid': 'utility',
  'nanoid': 'utility',
  'clsx': 'utility',
  'classnames': 'utility',
  'tailwind-merge': 'utility',
  'requests': 'utility',
  'httpx': 'utility',
  'aiohttp': 'utility',
  'urllib3': 'utility',
  'serde': 'utility',
  'serde_json': 'utility',
  'tokio': 'utility',
  'async-std': 'utility',
  'futures': 'utility',
}

// Detect category from package name
function detectCategory(name: string): Dependency['category'] {
  const normalizedName = name.toLowerCase().replace(/^@[^/]+\//, '')

  // Direct match
  if (PACKAGE_CATEGORIES[name.toLowerCase()]) {
    return PACKAGE_CATEGORIES[name.toLowerCase()]
  }

  // Check normalized name
  if (PACKAGE_CATEGORIES[normalizedName]) {
    return PACKAGE_CATEGORIES[normalizedName]
  }

  // Pattern-based detection
  if (normalizedName.includes('test') || normalizedName.includes('spec') || normalizedName.includes('mock')) {
    return 'testing'
  }
  if (normalizedName.includes('webpack') || normalizedName.includes('vite') || normalizedName.includes('rollup') || normalizedName.includes('esbuild')) {
    return 'build'
  }
  if (normalizedName.includes('eslint') || normalizedName.includes('prettier') || normalizedName.includes('stylelint')) {
    return 'build'
  }

  return 'core'
}

// Parse package.json
function parsePackageJson(content: string): ParsedManifest | null {
  try {
    const pkg = JSON.parse(content)
    const dependencies: Dependency[] = []

    // Production dependencies
    if (pkg.dependencies) {
      for (const [name, version] of Object.entries(pkg.dependencies)) {
        dependencies.push({
          name,
          version: typeof version === 'string' ? version : null,
          isDev: false,
          category: detectCategory(name),
        })
      }
    }

    // Dev dependencies
    if (pkg.devDependencies) {
      for (const [name, version] of Object.entries(pkg.devDependencies)) {
        dependencies.push({
          name,
          version: typeof version === 'string' ? version : null,
          isDev: true,
          category: detectCategory(name),
        })
      }
    }

    return {
      type: 'package.json',
      dependencies,
      scripts: pkg.scripts,
      engines: pkg.engines,
    }
  } catch {
    return null
  }
}

// Parse requirements.txt
function parseRequirementsTxt(content: string): ParsedManifest | null {
  try {
    const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'))
    const dependencies: Dependency[] = []

    for (const line of lines) {
      const trimmed = line.trim()
      // Handle various formats: pkg, pkg==1.0, pkg>=1.0, pkg~=1.0, pkg[bundles]
      // Use [^\]]* for non-greedy bracket matching, stop version at whitespace/comments
      const match = trimmed.match(/^([a-zA-Z0-9_-]+)(?:\[[^\]]*\])?\s*([=<>~!]+\S+)?(?:\s*#.*)?$/)
      if (match) {
        const [, name, version] = match
        dependencies.push({
          name,
          version: version || null,
          isDev: false,
          category: detectCategory(name),
        })
      }
    }

    return {
      type: 'requirements.txt',
      dependencies,
    }
  } catch {
    return null
  }
}

// Parse pyproject.toml (simplified - just extract deps section)
function parsePyprojectToml(content: string): ParsedManifest | null {
  try {
    const dependencies: Dependency[] = []

    // Simple regex-based parsing for dependency sections
    const depRegex = /^([a-zA-Z0-9_-]+)\s*=\s*["']?([^"'\n]+)["']?$/
    let inDepsSection = false
    let isDevDeps = false

    // Match TOML dependency sections including nested ones
    const depsSectionRegex = /^\[(project\.dependencies|tool\.poetry\.(?:dev-)?dependencies|project\.optional-dependencies(?:\.[^\]]+)?)\]/

    for (const line of content.split('\n')) {
      const trimmed = line.trim()

      // Check for dependency section
      const sectionMatch = trimmed.match(depsSectionRegex)
      if (sectionMatch) {
        inDepsSection = true
        isDevDeps = trimmed.includes('dev-') || trimmed.includes('optional')
        continue
      }

      // Check for new section (stop parsing deps)
      if (trimmed.startsWith('[') && !depsSectionRegex.test(trimmed)) {
        inDepsSection = false
        continue
      }

      if (inDepsSection) {
        const match = trimmed.match(depRegex)
        if (match) {
          const [, name, version] = match
          dependencies.push({
            name,
            version: version?.trim() || null,
            isDev: isDevDeps,
            category: detectCategory(name),
          })
        }
      }
    }

    return {
      type: 'pyproject.toml',
      dependencies,
    }
  } catch {
    return null
  }
}

// Parse Cargo.toml (Rust)
function parseCargoToml(content: string): ParsedManifest | null {
  try {
    const dependencies: Dependency[] = []
    let inDepsSection = false
    let inDevDepsSection = false

    for (const line of content.split('\n')) {
      const trimmed = line.trim()

      if (trimmed === '[dependencies]') {
        inDepsSection = true
        inDevDepsSection = false
        continue
      }
      if (trimmed === '[dev-dependencies]') {
        inDepsSection = false
        inDevDepsSection = true
        continue
      }
      if (trimmed.startsWith('[')) {
        inDepsSection = false
        inDevDepsSection = false
        continue
      }

      if (inDepsSection || inDevDepsSection) {
        const match = trimmed.match(/^([a-zA-Z0-9_-]+)\s*=\s*["']?([^"'\n]+)["']?/)
        if (match) {
          const [, name, version] = match
          dependencies.push({
            name,
            version: version?.trim() || null,
            isDev: inDevDepsSection,
            category: detectCategory(name),
          })
        }
      }
    }

    return {
      type: 'Cargo.toml',
      dependencies,
    }
  } catch {
    return null
  }
}

// Parse go.mod (Go modules)
function parseGoMod(content: string): ParsedManifest | null {
  try {
    const dependencies: Dependency[] = []
    // Handle semantic versions, pseudo-versions, and +incompatible suffix
    const requireRegex = /^\s*([a-zA-Z0-9./-]+)\s+(v[0-9.]+(?:-[a-zA-Z0-9]+)?(?:\+[a-zA-Z0-9]+)?)/

    let inRequire = false

    for (const line of content.split('\n')) {
      const trimmed = line.trim()

      if (trimmed === 'require (') {
        inRequire = true
        continue
      }
      if (trimmed === ')' && inRequire) {
        inRequire = false
        continue
      }

      // Single-line require
      if (trimmed.startsWith('require ')) {
        const match = trimmed.match(requireRegex)
        if (match) {
          dependencies.push({
            name: match[1],
            version: match[2],
            isDev: false,
            category: detectCategory(match[1]),
          })
        }
        continue
      }

      if (inRequire) {
        const match = trimmed.match(requireRegex)
        if (match) {
          dependencies.push({
            name: match[1],
            version: match[2],
            isDev: false,
            category: detectCategory(match[1]),
          })
        }
      }
    }

    return {
      type: 'go.mod',
      dependencies,
    }
  } catch {
    return null
  }
}

// Parse pom.xml (Maven) - simplified regex-based
function parsePomXml(content: string): ParsedManifest | null {
  try {
    const dependencies: Dependency[] = []
    const depRegex = /<dependency>\s*<groupId>([^<]+)<\/groupId>\s*<artifactId>([^<]+)<\/artifactId>(?:\s*<version>([^<]+)<\/version>)?/g

    let match
    while ((match = depRegex.exec(content)) !== null) {
      const [, groupId, artifactId, version] = match
      const name = `${groupId}:${artifactId}`
      dependencies.push({
        name,
        version: version || null,
        isDev: groupId.includes('test') || artifactId.includes('test'),
        category: detectCategory(artifactId),
      })
    }

    return {
      type: 'pom.xml',
      dependencies,
    }
  } catch {
    return null
  }
}

// Parse Gemfile (Ruby)
function parseGemfile(content: string): ParsedManifest | null {
  try {
    const dependencies: Dependency[] = []
    const gemRegex = /gem\s+['"]([^'"]+)['"](?:,\s*['"]([^'"]+)['"])?/g

    let match
    while ((match = gemRegex.exec(content)) !== null) {
      const [, name, version] = match
      dependencies.push({
        name,
        version: version || null,
        isDev: name.includes('test') || name.includes('spec') || content.includes('group :development'),
        category: detectCategory(name),
      })
    }

    return {
      type: 'Gemfile',
      dependencies,
    }
  } catch {
    return null
  }
}

// Parse pubspec.yaml (Flutter/Dart)
function parsePubspecYaml(content: string): ParsedManifest | null {
  try {
    const dependencies: Dependency[] = []
    let inDeps = false
    let inDevDeps = false

    for (const line of content.split('\n')) {
      const trimmed = line.trim()

      if (trimmed === 'dependencies:') {
        inDeps = true
        inDevDeps = false
        continue
      }
      if (trimmed === 'dev_dependencies:') {
        inDeps = false
        inDevDeps = true
        continue
      }
      if (trimmed.endsWith(':') && !trimmed.startsWith('  ')) {
        inDeps = false
        inDevDeps = false
        continue
      }

      if (inDeps || inDevDeps) {
        const match = trimmed.match(/^\s*([a-zA-Z0-9_-]+):\s*(.+)?$/)
        if (match) {
          const [, name, version] = match
          dependencies.push({
            name,
            version: version?.trim() || null,
            isDev: inDevDeps,
            category: detectCategory(name),
          })
        }
      }
    }

    return {
      type: 'pubspec.yaml',
      dependencies,
    }
  } catch {
    return null
  }
}

// Main parser function
export function parseManifest(path: string, content: string): ParsedManifest | null {
  const filename = path.split('/').pop()?.toLowerCase() || ''

  switch (filename) {
    case 'package.json':
      return parsePackageJson(content)
    case 'requirements.txt':
      return parseRequirementsTxt(content)
    case 'pyproject.toml':
      return parsePyprojectToml(content)
    case 'cargo.toml':
      return parseCargoToml(content)
    case 'go.mod':
      return parseGoMod(content)
    case 'pom.xml':
      return parsePomXml(content)
    case 'gemfile':
      return parseGemfile(content)
    case 'pubspec.yaml':
      return parsePubspecYaml(content)
    case 'build.gradle':
    case 'build.gradle.kts':
      // Simplified Gradle parsing - just return empty for now
      return {
        type: 'build.gradle',
        dependencies: [],
      }
    case 'composer.json':
      // PHP composer - parse as JSON similar to package.json
      try {
        const pkg = JSON.parse(content)
        const dependencies: Dependency[] = []

        if (pkg.require) {
          for (const [name, version] of Object.entries(pkg.require)) {
            dependencies.push({
              name,
              version: typeof version === 'string' ? version : null,
              isDev: false,
              category: detectCategory(name),
            })
          }
        }
        if (pkg['require-dev']) {
          for (const [name, version] of Object.entries(pkg['require-dev'])) {
            dependencies.push({
              name,
              version: typeof version === 'string' ? version : null,
              isDev: true,
              category: detectCategory(name),
            })
          }
        }

        return {
          type: 'composer.json',
          dependencies,
          scripts: pkg.scripts,
        }
      } catch {
        return null
      }
    default:
      return null
  }
}

// Categorize dependencies by type
export function categorizeDependencies(deps: Dependency[]): Record<string, number> {
  const categories: Record<string, number> = {
    core: 0,
    framework: 0,
    testing: 0,
    build: 0,
    utility: 0,
  }

  for (const dep of deps) {
    categories[dep.category] = (categories[dep.category] || 0) + 1
  }

  return categories
}
