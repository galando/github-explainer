import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { AuthProvider } from './contexts/AuthContext'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import App from './App.tsx'

// Initialize Google Analytics if measurement ID is configured
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID
if (GA_MEASUREMENT_ID) {
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  function gtag(...args: unknown[]) {
    window.dataLayer.push(args)
  }
  gtag('js', new Date())
  gtag('config', GA_MEASUREMENT_ID)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Analytics />
        <SpeedInsights />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
