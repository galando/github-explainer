// Google Analytics 4 helper
// GA is loaded in index.html via the gtag script tag.
// We declare gtag here so TypeScript knows about it.

declare function gtag(...args: unknown[]): void

function safeGtag(...args: unknown[]) {
  if (typeof gtag !== 'undefined') {
    gtag(...args)
  }
}

export function trackPageView(path: string, title?: string) {
  safeGtag('event', 'page_view', {
    page_path: path,
    page_title: title,
  })
}

export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
) {
  safeGtag('event', eventName, params)
}

// --- Specific event helpers ---

export function trackRepoViewed(repoFullName: string) {
  trackEvent('repo_viewed', { repo: repoFullName })
}

export function trackRepoAnalyzed(repoFullName: string) {
  trackEvent('repo_analyzed', { repo: repoFullName })
}

export function trackExplanationRequested(repoFullName: string, mode: string) {
  trackEvent('explanation_requested', { repo: repoFullName, mode })
}

export function trackSearchSubmitted(query: string) {
  trackEvent('search_submitted', { query })
}

export function trackSignIn() {
  trackEvent('sign_in', { provider: 'github' })
}

export function trackSignOut() {
  trackEvent('sign_out')
}

// Badge analytics
// Fired when a user clicks "Copy badge" on a repo page.
export function trackBadgeCopied(repoFullName: string) {
  trackEvent('badge_copied', {
    repo: repoFullName,
    event_category: 'badge',
    event_label: repoFullName,
  })
}

// Fired when someone arrives at the site via a badge link (?ref=badge in URL).
export function trackBadgeVisit(repoFullName?: string) {
  trackEvent('badge_visit', {
    event_category: 'badge',
    event_label: repoFullName ?? 'unknown',
    ...(repoFullName ? { repo: repoFullName } : {}),
  })
}

// Fired when a badge image itself is loaded (via /badge endpoint or og:image).
// Call this once on the Index page when ref=badge is in the URL params.
export function trackBadgeImpression(source?: string) {
  trackEvent('badge_impression', {
    event_category: 'badge',
    source: source ?? 'unknown',
  })
}

// Utility: detect and fire badge visit event once per page load
let badgeVisitTracked = false
export function detectAndTrackBadgeVisit() {
  if (badgeVisitTracked) return
  const params = new URLSearchParams(window.location.search)
  const ref = params.get('ref')
  const repo = params.get('repo')
  if (ref === 'badge') {
    badgeVisitTracked = true
    trackBadgeVisit(repo ?? undefined)
  }
}
