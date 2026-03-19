# GitHub Explainer — Self-Hosting Setup Guide

This guide walks you through deploying GitHub Explainer on your own Vercel + Supabase stack for free.

---

## What You Need Before Starting

- A GitHub account (for OAuth)
- A Supabase account (free tier at supabase.com)
- A Vercel account (free tier at vercel.com)
- A Groq API key (free at console.groq.com)
- Node.js 18+ installed locally

---

## Step 1: Clone and Install

```bash
git clone <your-repo-url>
cd github-explainer
npm install
```

---

## Step 2: Create a Supabase Project

1. Go to https://supabase.com/dashboard and click **New project**
2. Pick a name (e.g. "github-explainer"), set a database password, choose a region
3. Wait for it to provision (about 1 minute)
4. Go to **Settings > API** and copy:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **anon public** key (the long JWT string)

---

## Step 3: Configure GitHub OAuth in Supabase

1. In Supabase, go to **Authentication > Providers > GitHub**
2. Enable it
3. You will need a GitHub OAuth App — go to https://github.com/settings/developers
4. Click **New OAuth App** and fill in:
   - Application name: `GitHub Explainer`
   - Homepage URL: `https://your-vercel-domain.vercel.app`
   - Authorization callback URL: `https://xxxx.supabase.co/auth/v1/callback`
     (replace `xxxx` with your actual Supabase project ref)
5. Click **Register application**
6. Copy **Client ID** and generate a **Client Secret**
7. Paste both into the Supabase GitHub provider settings and save

---

## Step 4: Create the Edge Function Secret

1. In Supabase, go to **Settings > Edge Functions**
2. Under **Secrets**, add:
   - Name: `GROQ_API_KEY`
   - Value: your Groq API key from https://console.groq.com

---

## Step 5: Set Up GitHub Actions Secrets

For automatic deployments via GitHub Actions, add these secrets to your repository:

1. Go to your repo on GitHub → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** and add:

| Secret | Where to get it |
|--------|----------------|
| `SUPABASE_PROJECT_REF` | Your project ref from `supabase projects list` (e.g., `gphmteuolhmtycfcjgzq`) |
| `SUPABASE_ACCESS_TOKEN` | Generate at https://supabase.com/dashboard/account/tokens |

Also add these secrets for the CI workflow:

| Secret | Where to get it |
|--------|----------------|
| `VITE_SUPABASE_URL` | From Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | From Supabase Dashboard → Settings → API |
| `VITE_GITHUB_CLIENT_ID` | From your GitHub OAuth App settings |

---

## Step 6: Create Badge Tracking Table (Optional)

To track badge views, create a table in Supabase:

1. Go to **SQL Editor** in Supabase Dashboard
2. Run this SQL:

```sql
CREATE TABLE IF NOT EXISTS badge_views (
  id BIGSERIAL PRIMARY KEY,
  repo_full_name TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_badge_views_repo ON badge_views(repo_full_name);
CREATE INDEX IF NOT EXISTS idx_badge_views_created ON badge_views(created_at);

-- Enable Row Level Security
ALTER TABLE badge_views ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for badge tracking from external sites)
CREATE POLICY "Allow anonymous inserts" ON badge_views
  FOR INSERT WITH CHECK (true);
```

This lets you track:
- How many times your badge is viewed
- Which repos have badges installed
- Where badge traffic comes from (referrer)

---

## Step 7: Deploy the Edge Functions

Install the Supabase CLI if you have not already:

```bash
npm install -g supabase
```

Then login and link your project:

```bash
supabase login
supabase link --project-ref your-project-ref
```

Deploy the function:

```bash
supabase functions deploy explain-code --no-verify-jwt
```

The `--no-verify-jwt` flag allows your frontend to call the function without a logged-in user (needed for public repo explanations).

Verify it works:

```bash
curl -X POST https://xxxx.supabase.co/functions/v1/explain-code \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"type":"explanation","content":"Repository: test/repo\nDescription: A test repo","context":{"mode":"quick"}}'
```

---

## Step 8: Set Up Environment Variables Locally

Copy the example file:

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GITHUB_CLIENT_ID=your_github_oauth_client_id
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Notes:
- `VITE_GITHUB_CLIENT_ID` is from your GitHub OAuth App (NOT the secret)
- `VITE_GA_MEASUREMENT_ID` is optional — leave as `G-XXXXXXXXXX` if not using Analytics
- `GROQ_API_KEY` is NOT here — it stays in Supabase Edge Function Secrets only

Test locally:

```bash
npm run dev
```

Open http://localhost:5173 and try analyzing a repo.

---

## Step 9: Deploy to Vercel

### Option A: Via Vercel CLI

```bash
npm install -g vercel
vercel
```

During setup, choose "No" for existing project and follow the prompts.

After the first deploy, add environment variables:

```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_GITHUB_CLIENT_ID
vercel env add VITE_GA_MEASUREMENT_ID
```

Then redeploy:

```bash
vercel --prod
```

### Option B: Via Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Under **Environment Variables**, add the 4 variables above
4. Click **Deploy**

The `vercel.json` in this repo already handles SPA routing (all routes go to `index.html`).

---

## Step 10: Update Callback URLs

After your Vercel deployment, you have a URL like `https://your-app.vercel.app`.

Update two places:

1. **GitHub OAuth App** (https://github.com/settings/developers): Change the Authorization callback URL to `https://xxxx.supabase.co/auth/v1/callback` (this should already be set correctly).

2. **Supabase Auth settings** (Authentication > URL Configuration): Add your Vercel domain to the **Redirect URLs** list: `https://your-app.vercel.app/auth/callback`

---

## Step 11: Set Up Google Analytics (Optional)

1. Go to https://analytics.google.com
2. Create a new GA4 property
3. Under **Data Streams**, add a Web stream pointing to your domain
4. Copy the **Measurement ID** (format: `G-XXXXXXXXXX`)
5. Set it as `VITE_GA_MEASUREMENT_ID` in your Vercel environment variables

### What is tracked

| Event | Trigger |
|-------|---------|
| `page_view` | Every page navigation |
| `repo_viewed` | Visiting a repo analysis page |
| `explanation_requested` | Clicking "Generate Explanation" |
| `badge_copied` | Clicking "Copy Badge Markdown" on ShareCard |
| `badge_visit` | Someone arrives via a badge link (`?ref=badge`) |
| `sign_in` | User signs in with GitHub |
| `search_submitted` | Search/URL submitted |

To track badge visits in GA4, create a custom report filtering on event name `badge_visit` and `badge_copied`. The `repo` parameter tells you which repos have the most badges embedded.

---

## Troubleshooting

**"Missing Supabase environment variables" error**
Make sure your `.env` file exists and has the correct values. In Vercel, confirm the env vars are set under Settings > Environment Variables.

**GitHub OAuth returns error**
Check that your callback URL in the GitHub OAuth App matches exactly: `https://xxxx.supabase.co/auth/v1/callback`.

**Edge Function returns 500**
Check that `GROQ_API_KEY` is set in Supabase Secrets (not in `.env`). View function logs in Supabase Dashboard > Edge Functions > explain-code > Logs.

**Rate limiting from GitHub API**
Sign in with GitHub to get 5000 requests/hour instead of 60.

**Popup blocked when signing in**
Some browsers block popups by default. The app falls back to same-tab redirect automatically, but the user may need to allow popups for best UX.

---

## Cost

Everything runs on free tiers:

| Service | Free tier |
|---------|-----------|
| Vercel | 100 GB bandwidth/month, unlimited deploys |
| Supabase | 500 MB database, 2 GB bandwidth, 500K Edge Function invocations/month |
| Groq | 14,400 requests/day on free tier (as of 2025) |
| GitHub API | 60 req/hr unauthenticated, 5000 req/hr with OAuth token |
| Google Analytics | Free |

For a small personal project, you will not hit any limits.
