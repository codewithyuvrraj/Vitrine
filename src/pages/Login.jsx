import React, { useState } from 'react'
import { signUpUser, loginUser } from '../lib/auth'
import './Login.css'

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    website: '',
    profilePic: null
  })
  const [profilePicPreview, setProfilePicPreview] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

    try {
      await loginUser(email, password)
      onLogin?.()
    } catch (err) {
      console.error('Login exception:', err)
      setError(err.message || 'Login failed')
    }
  }

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setProfileData(prev => ({ ...prev, profilePic: file }))
      const reader = new FileReader()
      reader.onload = (e) => setProfilePicPreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!profileData.firstName || !profileData.lastName) {
      setError('First name and last name are required')
      return
    }
    
    try {
      await signUpUser(email, password, profileData)
      alert('✅ Account created successfully with your profile! You can now log in.')
      setIsSignUp(false)
      setProfileData({ firstName: '', lastName: '', bio: '', website: '', profilePic: null })
      setProfilePicPreview('')
    } catch (err) {
      console.error('Signup exception:', err)
      setError(err.message || 'Signup failed')
    }
  }

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>{isSignUp ? 'Sign Up for Instagram Clone' : 'Login to Instagram Clone'}</h2>
        <form onSubmit={isSignUp ? handleSignUp : handleLogin}>
          {isSignUp && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="First Name"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </div>
              
              <div style={{ textAlign: 'center', margin: '1rem 0' }}>
                <label style={{ cursor: 'pointer', display: 'block' }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    border: '2px dashed rgba(255,255,255,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 0.5rem',
                    overflow: 'hidden',
                    background: profilePicPreview ? 'none' : 'rgba(255,255,255,0.1)'
                  }}>
                    {profilePicPreview ? (
                      <img src={profilePicPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '24px' }}>📷</span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>Upload Profile Picture</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePicChange}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
              
              <textarea
                placeholder="Bio (optional)"
                value={profileData.bio}
                onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                rows="3"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
              
              <input
                type="url"
                placeholder="Website URL (optional)"
                value={profileData.website}
                onChange={(e) => setProfileData(prev => ({ ...prev, website: e.target.value }))}
              />
            </>
          )}
          
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <button type="submit" className="btn" style={{ width: '100%' }}>
            {isSignUp ? 'Create Account' : 'Login'}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button 
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError('')
              setProfileData({ firstName: '', lastName: '', bio: '', website: '', profilePic: null })
              setProfilePicPreview('')
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.8)',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
          </button>
        </div>
        
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  )
}

export default Login