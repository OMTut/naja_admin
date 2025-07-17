import '../../styles/App.css'
import LoginWithDiscord from './LoginWithDiscord'
import { useAuth } from '../../hooks'
import {useEffect, useState } from 'react'

const LoginComponent = () => {
  const { isAuthenticated, user, loading, error, logout } = useAuth()
  const [urlMessage, setUrlMessage] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null)

  useEffect(() => {
    // Check URL parameters for auth messages
    const urlParams = new URLSearchParams(window.location.search)
    const authStatus = urlParams.get('auth')
    const errorType = urlParams.get('error')
    const message = urlParams.get('message')

    if (authStatus === 'pending' && message) {
      setUrlMessage({ type: 'success', message: decodeURIComponent(message) })
    } else if (errorType && message) {
      const messageType = errorType === 'user_exists' ? 'info' : 'error'
      setUrlMessage({ type: messageType, message: decodeURIComponent(message) })
    }

    // Clean up URL parameters after reading them
    if (authStatus || errorType) {
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  if (loading) {
    return (
        <>
            <div><p>Loading...</p></div>
        </>
    )
  }

  if (error) { console.error('Auth error:', error) }

  return (
    <>

      {isAuthenticated ? (
        <div>
          <p>Session Found.</p>
          {user && (
            <div>
              <p>Welcome, {user.discord_username}!</p>
              <button onClick={logout}>Logout</button>
            </div>
          )}
        </div>
      ) : (
        <LoginWithDiscord 
          message={urlMessage}

        />
      )}
    </>
  )
}

export default LoginComponent