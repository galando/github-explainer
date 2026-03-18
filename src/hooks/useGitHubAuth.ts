import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { githubService } from '@/services/github'

export function useGitHubAuth() {
  const { gitHubToken } = useAuth()

  useEffect(() => {
    githubService.setUserToken(gitHubToken)
  }, [gitHubToken])
}
