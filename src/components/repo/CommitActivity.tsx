import { WeeklyCommitStat } from '@/services/github'

interface CommitActivityProps {
  weeks: WeeklyCommitStat[] | null
}

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function getMonthLabels(weeks: WeeklyCommitStat[]): { index: number; label: string }[] {
  const labels: { index: number; label: string }[] = []
  let lastMonth = -1
  weeks.forEach((w, i) => {
    const d = new Date(w.week * 1000)
    const m = d.getMonth()
    if (m !== lastMonth) {
      labels.push({ index: i, label: MONTH_SHORT[m] })
      lastMonth = m
    }
  })
  return labels
}

export function CommitActivity({ weeks }: CommitActivityProps) {
  // Take last 26 weeks
  const data = weeks ? weeks.slice(-26) : []

  if (data.length === 0) return null

  const max = Math.max(...data.map(w => w.total), 1)
  const totalCommits = data.reduce((s, w) => s + w.total, 0)
  const activeWeeks = data.filter(w => w.total > 0).length
  const monthLabels = getMonthLabels(data)

  return (
    <div className="bg-[--color-background-secondary] rounded-xl border border-[--color-border-default] p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[--color-text-primary]">Commit Activity</h3>
        <div className="flex items-center gap-3 text-xs text-[--color-text-muted]">
          <span>{totalCommits} commits</span>
          <span>{activeWeeks} active weeks</span>
        </div>
      </div>

      {/* Sparkline bars */}
      <div className="flex items-end gap-0.5 h-12">
        {data.map((w, i) => {
          const heightPct = w.total > 0 ? Math.max((w.total / max) * 100, 10) : 2
          const opacity = 0.3 + (w.total / max) * 0.7
          const d = new Date(w.week * 1000)
          const dateStr = `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}: ${w.total} commit${w.total !== 1 ? 's' : ''}`
          return (
            <div
              key={i}
              title={dateStr}
              className="flex-1 rounded-sm cursor-default"
              style={{
                height: `${heightPct}%`,
                backgroundColor: w.total > 0
                  ? `rgba(99, 102, 241, ${opacity})`
                  : 'var(--color-background-tertiary)',
              }}
            />
          )
        })}
      </div>

      {/* Month axis */}
      <div className="relative h-5 mt-1">
        {monthLabels.map(({ index, label }) => (
          <span
            key={label + index}
            className="absolute text-[10px] text-[--color-text-muted] leading-none"
            style={{ left: `${(index / data.length) * 100}%` }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
