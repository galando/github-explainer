import { useState, useEffect } from 'react'

const STEPS = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 3.5A1.5 1.5 0 012.5 2h11A1.5 1.5 0 0115 3.5v9A1.5 1.5 0 0113.5 14h-11A1.5 1.5 0 011 12.5v-9z" />
        <path d="M1 6h14" />
        <path d="M4 9.5h8M4 11.5h5" />
      </svg>
    ),
    label: 'Fetching repository metadata',
    delay: 0,
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3.5A1.5 1.5 0 013.5 2h3l1.5 2H14a1.5 1.5 0 011.5 1.5v7A1.5 1.5 0 0114 14H3.5A1.5 1.5 0 012 12.5V3.5z" />
      </svg>
    ),
    label: 'Scanning file tree',
    delay: 700,
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="8" r="6.5" />
        <path d="M8 4v4l2.5 2.5" />
      </svg>
    ),
    label: 'Detecting tech stack',
    delay: 1500,
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="1" width="6" height="5" rx="1" />
        <rect x="9" y="1" width="6" height="5" rx="1" />
        <rect x="1" y="10" width="6" height="5" rx="1" />
        <rect x="9" y="10" width="6" height="5" rx="1" />
      </svg>
    ),
    label: 'Analyzing architecture',
    delay: 2400,
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 1.5l1.84 3.73 4.12.6-2.98 2.9.7 4.1L8 10.77l-3.68 1.93.7-4.1L2.04 5.83l4.12-.6L8 1.5z" />
      </svg>
    ),
    label: 'Generating AI explanation',
    delay: 3300,
  },
]

function SkeletonCard({ lines = 3, tall = false }: { lines?: number; tall?: boolean }) {
  return (
    <div className={`bg-[--color-background-secondary] rounded-xl border border-[--color-border-default] ${tall ? 'p-6' : 'p-5'}`}>
      <div className="h-4 bg-[--color-background-tertiary] rounded w-1/3 mb-4 animate-pulse" />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 bg-[--color-background-tertiary] rounded mb-2 animate-pulse"
          style={{ width: `${60 + (i % 3) * 15}%` }}
        />
      ))}
    </div>
  )
}

export function LoadingAnalysis() {
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const timers = STEPS.map((step, i) =>
      setTimeout(() => setActiveStep(i), step.delay)
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div>
      {/* Animated step progress */}
      <div className="flex flex-col items-center justify-center py-16 gap-10">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-[--color-background-secondary] border border-[--color-border-default] flex items-center justify-center mx-auto mb-4"
            style={{ color: 'var(--color-accent-blue)' }}
          >
            {STEPS[activeStep].icon}
          </div>
          <h2 className="text-xl font-semibold text-[--color-text-primary] mb-1">Analyzing Repository</h2>
          <p className="text-sm text-[--color-text-muted]">This usually takes a few seconds</p>
        </div>

        {/* Steps list */}
        <div className="w-full max-w-xs space-y-2">
          {STEPS.map((step, i) => {
            const done = i < activeStep
            const active = i === activeStep
            return (
              <div
                key={i}
                className="flex items-center gap-3 text-sm transition-all duration-300"
                style={{
                  color: done
                    ? 'var(--color-text-secondary)'
                    : active
                    ? 'var(--color-text-primary)'
                    : 'var(--color-text-muted)',
                  opacity: done ? 0.6 : 1,
                }}
              >
                {/* State icon */}
                <div className="shrink-0 w-5 h-5 flex items-center justify-center">
                  {done ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#3fb950" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 8l4 4 8-8" />
                    </svg>
                  ) : active ? (
                    <div className="w-4 h-4 rounded-full border-2 border-[--color-accent-blue] border-t-transparent animate-spin" />
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-[--color-background-tertiary]" />
                  )}
                </div>

                {/* Step label */}
                <span className={active ? 'font-medium' : ''}>{step.label}</span>

                {/* Step icon (shown when active) */}
                {active && (
                  <span className="ml-auto" style={{ color: 'var(--color-accent-blue)', opacity: 0.7 }}>
                    {step.icon}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Skeleton cards below to hint at page structure */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 opacity-40">
        <div className="lg:col-span-2 space-y-6">
          <SkeletonCard lines={5} tall />
          <SkeletonCard lines={3} />
        </div>
        <div className="space-y-6">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={5} tall />
        </div>
      </div>
    </div>
  )
}
