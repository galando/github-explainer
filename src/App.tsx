import { Routes, Route } from 'react-router'
import Index from '@/pages/Index'
import Repository from '@/pages/Repository'
import Category from '@/pages/Category'
import Trending from '@/pages/Trending'
import Comparison from '@/pages/Comparison'
import Explain from '@/pages/Explain'
import AuthCallback from '@/pages/AuthCallback'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import CategoryBrowser from '@/components/home/CategoryBrowser'
import { ScrollToTop } from '@/components/layout/ScrollToTop'
import { useGitHubAuth } from '@/hooks/useGitHubAuth'

export default function App() {
  // Sync authenticated user's GitHub token with the service worker
  useGitHubAuth()

  return (
    <Routes>
      {/* Auth callback - minimal page for OAuth popup */}
      <Route path="/auth-callback" element={<AuthCallback />} />

      {/* Main app with layout */}
      <Route
        path="*"
        element={
          <div className="min-h-screen bg-[--color-background]">
            <ScrollToTop />
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/repo/:owner/:repoName" element={<Repository />} />
                <Route path="/explain/:owner/:repoName" element={<Repository />} />
                <Route path="/category/:category" element={<Category />} />
                <Route path="/trending" element={<Trending />} />
                <Route path="/trending/:timeframe" element={<Trending />} />
                <Route path="/compare" element={<Comparison />} />
              </Routes>
            </main>
            <CategoryBrowser />
            <Footer />
          </div>
        }
      />
    </Routes>
  )
}
