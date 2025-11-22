import React, { useState, useEffect } from 'react'
import { nhost } from './lib/nhost'
import Login from './pages/Login'
import InstagramLayout from './components/InstagramLayout'

const App = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await nhost.auth.getUser()
        
        if (userData?.body?.id || userData?.id) {
          console.log('✅ User authenticated:', userData?.body?.email || userData?.email)
          setUser(userData)
        } else {
          setUser(null)
        }
      } catch (error) {
        // 401 Unauthorized is expected when logged out
        if (error.message?.includes('unauthorized')) {
          console.log('👤 No user logged in')
        } else {
          console.log('Auth check error:', error)
        }
        setUser(null)
      }
      setLoading(false)
    }
    
    checkAuth()
  }, [])

  const handleLogin = async () => {
    try {
      const userData = await nhost.auth.getUser()
      setUser(userData)
    } catch (error) {
      console.log('Login handler error:', error)
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--theme-bg, linear-gradient(135deg, #667eea 0%, #764ba2 100%))',
        color: '#fff'
      }}>
        Loading...
      </div>
    )
  }

  return user ? <InstagramLayout /> : <Login onLogin={handleLogin} />
}

export default App