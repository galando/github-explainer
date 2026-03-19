/// <reference types="vite/client" />

interface Window {
  dataLayer: unknown[][]
}

interface ImportMetaEnv {
  readonly VITE_GA_MEASUREMENT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
