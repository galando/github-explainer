/**
 * Merge class names, filtering out falsy values.
 * For full Tailwind conflict resolution, install clsx + tailwind-merge
 * and replace this with: import { clsx } from 'clsx'; import { twMerge } from 'tailwind-merge'
 * Usage: cn('px-4 py-2', isActive && 'bg-blue-500', className)
 */
export function cn(...inputs: (string | undefined | null | false | 0)[]): string {
  return inputs.filter(Boolean).join(' ')
}

/**
 * Format a number with k/m suffix.
 */
export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

/**
 * Human-readable relative time ("3 days ago").
 */
export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

/**
 * Truncate a string to maxLen characters, adding ellipsis if needed.
 */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen - 3) + '...'
}

/**
 * Debounce a function.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

/**
 * Parse owner and repo name from a GitHub URL or "owner/repo" string.
 * Returns null if the input is not a valid repo reference.
 */
export function parseGitHubRef(input: string): { owner: string; repo: string } | null {
  const trimmed = input.trim()

  const urlPattern = /github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/
  const urlMatch = trimmed.match(urlPattern)
  if (urlMatch) return { owner: urlMatch[1], repo: urlMatch[2] }

  const slugPattern = /^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/
  const slugMatch = trimmed.match(slugPattern)
  if (slugMatch) return { owner: slugMatch[1], repo: slugMatch[2] }

  return null
}
