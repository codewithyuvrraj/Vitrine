import React, { useState } from 'react'
import { nhost } from '../lib/nhost'
import Posts from './Posts'
import Reels from './Reels'
import Chat from './Chat'
import UploadTest from '../components/UploadTest'

const Home = () => {
  const [activeTab, setActiveTab] = useState('posts')
  const user = nhost.auth.getUser()

  const handleLogout = async () => {
    await nhost.auth.signOut()
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1a1a1a', color: 'white' }}>
      <header style={{ 
        padding: '1rem', 
        backgroundColor: '#0f0f0f', 
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1>GENZES CHATS</h1>
        <div>
          <span>Welcome, {user?.displayName || user?.email || 'User'}</span>
          <button onClick={handleLogout} style={{ marginLeft: 10 }}>Logout</button>
        </div>
      </header>

      <nav style={{ 
        display: 'flex', 
        gap: '1rem', 
        padding: '1rem',
        backgroundColor: '#0f0f0f',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <button 
          onClick={() => setActiveTab('posts')}
          style={{ 
            background: activeTab === 'posts' ? '#667eea' : 'transparent',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Posts
        </button>
        <button 
          onClick={() => setActiveTab('reels')}
          style={{ 
            background: activeTab === 'reels' ? '#667eea' : 'transparent',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Reels
        </button>
        <button 
          onClick={() => setActiveTab('chat')}
          style={{ 
            background: activeTab === 'chat' ? '#667eea' : 'transparent',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Chat
        </button>
        <button 
          onClick={() => setActiveTab('test')}
          style={{ 
            background: activeTab === 'test' ? '#667eea' : 'transparent',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Upload Test
        </button>
      </nav>

      <main>
        {activeTab === 'posts' && <Posts />}
        {activeTab === 'reels' && <Reels />}
        {activeTab === 'chat' && <Chat />}
        {activeTab === 'test' && <UploadTest />}
      </main>
    </div>
  )
}

export default Home