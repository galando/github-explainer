/// <reference types="vite/client" />

interface Window {
  dataLayer: unknown[][]
  gtag: (...args: unknown[]) => void
}

interface ImportMetaEnv {
  readonly VITE_GA_MEASUREMENT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
