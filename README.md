# GitHub Explainer

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Deploy](https://img.shields.io/github/deployments/galando/github-explainer/production?label=vercel)](https://github-explainer.vercel.app)
[![CI](https://github.com/galando/github-explainer/actions/workflows/ci.yml/badge.svg)](https://github.com/galando/github-explainer/actions/workflows/ci.yml)
[![Supabase](https://img.shields.io/badge/Powered%20by-Supabase-3ECF8E)](https://supabase.com)

**Understand any GitHub repository instantly with AI-powered explanations.**

Paste a GitHub URL and get immediate insights into architecture, tech stack, key files, and execution flow — no more staring at unfamiliar codebases wondering where to start.

<!-- Add screenshot here: ![GitHub Explainer Screenshot](./docs/screenshot.png) -->

## Features

- **AI-Powered Explanations** — 4 depth levels from executive summary to deep technical analysis
- **Architecture Diagrams** — Visual representation of code structure and dependencies
- **Tech Stack Analysis** — Automatic detection of frameworks, libraries, and tools
- **Key Files Identification** — Find entry points and important modules instantly
- **Interactive Chat** — Ask questions about the codebase in natural language
- **Repository Comparison** — Compare similar repos side by side
- **Trending Repositories** — Discover popular projects with AI explanations

## Quick Start

Visit **[github-explainer.vercel.app](https://github-explainer.vercel.app)** and paste any GitHub URL:

```
github.com/facebook/react
```

Or use the short format:

```
facebook/react
```

Try these examples:
- [React](https://github-explainer.vercel.app/repo/facebook/react) — UI library
- [Next.js](https://github-explainer.vercel.app/repo/vercel/next.js) — Full-stack framework
- [FastAPI](https://github-explainer.vercel.app/repo/tiangolo/fastapi) — Python API framework
- [Supabase](https://github-explainer.vercel.app/repo/supabase/supabase) — Backend platform

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, TailwindCSS 4 |
| Build | Vite 6 |
| Backend | Supabase Edge Functions (Deno) |
| Auth | Supabase Auth + GitHub OAuth |
| AI | Groq API (LLaMA) |
| Hosting | Vercel |

## Self-Hosting

See [SETUP.md](./SETUP.md) for complete setup instructions.

### Prerequisites

- Node.js 18+
- Supabase account
- Groq API key
- GitHub OAuth App (optional, for higher rate limits)

### Environment Variables

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GITHUB_CLIENT_ID=your-github-client-id
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX  # optional
```

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/galando/github-explainer)

1. Click the button above
2. Add environment variables
3. Deploy

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run linting
npm run lint

# Build for production
npm run build
```

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License — see [LICENSE](./LICENSE) for details.

## Acknowledgments

- [Groq](https://groq.com) for fast AI inference
- [Supabase](https://supabase.com) for backend infrastructure
- [Vercel](https://vercel.com) for hosting

---

Made with ❤️ by [Galando](https://github.com/galando)
