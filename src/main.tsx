import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { AuthProvider } from './contexts/AuthContext'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import App from './App.tsx'

// Initialize Google Analytics if measurement ID is configured
// Must match official GA snippet exactly: https://developers.google.com/analytics/devguides/collection/ga4
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID
if (GA_MEASUREMENT_ID) {
  // Setup dataLayer and gtag BEFORE loading the script (per GA documentation)
  window.dataLayer = window.dataLayer || []
  // Use traditional function to preserve 'arguments' object (required by GA)
  // Official snippet: function gtag(){dataLayer.push(arguments);}
  window.gtag = function () {
    // eslint-disable-next-line prefer-rest-params, @typescript-eslint/no-explicit-any
    ;(window.dataLayer as any[]).push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', GA_MEASUREMENT_ID)

  // Load the gtag script
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  document.head.appendChild(script)
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
