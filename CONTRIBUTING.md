# Contributing to GitHub Explainer

Thank you for your interest in contributing! This document provides guidelines and instructions.

## Development Setup

### Prerequisites

- Node.js 18+
- npm 9+
- A Supabase account (for local development)
- A Groq API key

### Getting Started

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/github-explainer.git
cd github-explainer

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Start development server
npm run dev
```

## Code Style

We use ESLint and TypeScript for code quality:

```bash
# Run linter
npm run lint

# Type check
npx tsc --noEmit
```

### Guidelines

- **TypeScript**: Use strict mode, avoid `any` types
- **Components**: Functional components with hooks (no class components)
- **Styling**: TailwindCSS utility classes, avoid inline styles
- **Formatting**: Follow existing patterns in the codebase

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: resolve bug
docs: update documentation
style: formatting changes
refactor: code restructuring
test: add tests
chore: maintenance tasks
```

## Pull Request Process

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** with clear, atomic commits

3. **Run checks** before pushing:
   ```bash
   npm run lint
   npm run build
   ```

4. **Push and create PR**:
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Fill out the PR template** with:
   - Description of changes
   - Related issue (if any)
   - Testing steps

6. **Wait for CI** to pass and address any feedback

## Project Structure

```
src/
├── components/       # React components
│   ├── home/        # Landing page components
│   ├── layout/      # Header, Footer, etc.
│   ├── repo/        # Repository analysis components
│   └── ui/          # Reusable UI components
├── contexts/        # React contexts
├── hooks/           # Custom hooks
├── lib/             # Utility functions
├── pages/           # Route pages
├── services/        # API services
└── integrations/    # External service integrations

supabase/
└── functions/       # Edge Functions (Deno)
    ├── explain-code/
    ├── github-auth/
    ├── github-proxy/
    └── badge/
```

## Questions?

Open an issue for bugs, feature requests, or questions.

---

Thank you for contributing! 🎉
