import React, { useState, useEffect } from 'react';
import { nhost } from '../lib/nhost';
import { uploadToCloudinary } from '../lib/cloudinary';
import UserPosts from './UserPosts';

const Profile = ({ user, viewingProfile, currentUser, onBackToOwnProfile }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    display_name: '',
    bio: '',
    website_url: '',
    avatar_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [uploadingMusic, setUploadingMusic] = useState(false);
  const [musicUrl, setMusicUrl] = useState('');

  useEffect(() => {
    const profileUser = viewingProfile || user;
    if (profileUser) {
      fetchProfile();
    }
  }, [user, viewingProfile]);

  const fetchProfile = async () => {
    const profileUser = viewingProfile || user;
    if (!profileUser?.id) return;
    
    try {
      const { data } = await nhost.graphql.request(`
        query GetProfile($userId: uuid!) {
          user_profiles(where: {user_id: {_eq: $userId}}) {
            display_name
            bio
            website_url
            avatar_url
          }
        }
      `, { userId: profileUser.id });
      
      if (data.user_profiles[0]) {
        setProfile(data.user_profiles[0]);
      } else {
        // Use the user data directly if no profile found
        setProfile({
          display_name: profileUser.displayName || '',
          bio: profileUser.bio || '',
          website_url: profileUser.website || '',
          avatar_url: profileUser.avatarUrl || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Fallback to user data
      setProfile({
        display_name: profileUser.displayName || '',
        bio: profileUser.bio || '',
        website_url: profileUser.website || '',
        avatar_url: profileUser.avatarUrl || ''
      });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await nhost.graphql.request(`
        mutation UpsertProfile($userId: uuid!, $displayName: String, $bio: String, $websiteUrl: String, $avatarUrl: String) {
          insert_user_profiles_one(
            object: {
              user_id: $userId,
              display_name: $displayName,
              bio: $bio,
              website_url: $websiteUrl,
              avatar_url: $avatarUrl
            },
            on_conflict: {
              constraint: user_profiles_user_id_key,
              update_columns: [display_name, bio, website_url, avatar_url]
            }
          ) {
            id
          }
        }
      `, {
        userId: user.id,
        displayName: profile.display_name,
        bio: profile.bio,
        websiteUrl: profile.website_url,
        avatarUrl: profile.avatar_url
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
    setLoading(false);
  };

  const handleWebsiteClick = (url) => {
    if (url) {
      const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
      window.open(formattedUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleMusicUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check if file is audio
    if (!file.type.startsWith('audio/')) {
      alert('Please select an audio file');
      return;
    }

    setUploadingMusic(true);
    try {
      const url = await uploadToCloudinary(file, 'audio');
      setMusicUrl(url);
      alert('Music uploaded successfully!');
    } catch (error) {
      console.error('Music upload failed:', error);
      alert('Failed to upload music. Please try again.');
    } finally {
      setUploadingMusic(false);
    }
  };

  const profileUser = viewingProfile || user;
  const isOwnProfile = !viewingProfile || (currentUser && viewingProfile?.id === currentUser.id);

  return (
    <div>
      {/* Back button when viewing another user's profile */}
      {viewingProfile && onBackToOwnProfile && (
        <div style={{ marginBottom: '1rem' }}>
          <button
            onClick={onBackToOwnProfile}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '6px',
              color: '#fff',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span>←</span> Back to My Profile
          </button>
        </div>
      )}
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '500px',
        margin: '0 auto 2rem auto'
      }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: profile.avatar_url ? `url(${profile.avatar_url})` : '#666',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          margin: '0 auto 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem'
        }}>
          {!profile.avatar_url && '👤'}
        </div>
        
        {isEditing ? (
          <input
            type="text"
            value={profile.display_name}
            onChange={(e) => setProfile({...profile, display_name: e.target.value})}
            placeholder="Display Name"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '6px',
              padding: '0.5rem',
              color: 'white',
              textAlign: 'center',
              fontSize: '1.2rem',
              width: '100%'
            }}
          />
        ) : (
          <h2 style={{ margin: '0 0 0.5rem 0' }}>
            {profile.display_name || profileUser?.displayName || 'User'}
          </h2>
        )}
      </div>

      {/* Bio Section */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
          Bio:
        </label>
        {isEditing ? (
          <textarea
            value={profile.bio}
            onChange={(e) => setProfile({...profile, bio: e.target.value})}
            placeholder="Tell us about yourself..."
            rows={3}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '6px',
              padding: '0.5rem',
              color: 'white',
              resize: 'vertical'
            }}
          />
        ) : (
          <p style={{ 
            background: 'rgba(255,255,255,0.05)',
            padding: '0.75rem',
            borderRadius: '6px',
            margin: 0,
            minHeight: '2rem'
          }}>
            {profile.bio || 'No bio added yet'}
          </p>
        )}
      </div>

      {/* Website URL Section */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
          Website:
        </label>
        {isEditing ? (
          <input
            type="url"
            value={profile.website_url}
            onChange={(e) => setProfile({...profile, website_url: e.target.value})}
            placeholder="https://yourwebsite.com"
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '6px',
              padding: '0.5rem',
              color: 'white'
            }}
          />
        ) : (
          <div style={{ 
            background: 'rgba(255,255,255,0.05)',
            padding: '0.75rem',
            borderRadius: '6px',
            minHeight: '2rem',
            display: 'flex',
            alignItems: 'center'
          }}>
            {profile.website_url ? (
              <button
                onClick={() => handleWebsiteClick(profile.website_url)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0095f6',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  padding: 0
                }}
              >
                {profile.website_url}
              </button>
            ) : (
              <span style={{ color: '#8e8e8e' }}>No website added</span>
            )}
          </div>
        )}
      </div>

      {/* Avatar URL Section (for editing) */}
      {isEditing && (
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            Avatar URL:
          </label>
          <input
            type="url"
            value={profile.avatar_url}
            onChange={(e) => setProfile({...profile, avatar_url: e.target.value})}
            placeholder="https://example.com/avatar.jpg"
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '6px',
              padding: '0.5rem',
              color: 'white'
            }}
          />
        </div>
      )}

      {/* Music Upload Section */}
      {isOwnProfile && (
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            Upload Music:
          </label>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input
              type="file"
              accept="audio/*"
              onChange={handleMusicUpload}
              disabled={uploadingMusic}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '6px',
                padding: '0.5rem',
                color: 'white',
                cursor: uploadingMusic ? 'not-allowed' : 'pointer'
              }}
            />
            {uploadingMusic && (
              <span style={{ color: '#0095f6', fontSize: '0.9rem' }}>Uploading...</span>
            )}
          </div>
          {musicUrl && (
            <div style={{ marginTop: '0.5rem' }}>
              <audio controls style={{ width: '100%' }}>
                <source src={musicUrl} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
              <div style={{ color: '#8e8e8e', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                Music uploaded successfully!
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons - Only show for own profile */}
      {isOwnProfile && (
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={loading}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#0095f6',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                disabled={loading}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '6px',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '6px',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Edit Profile
            </button>
          )}
        </div>
      )}
    </div>
    
    {/* Show user posts */}
    <UserPosts user={profileUser} currentUser={currentUser} />
    </div>
  );
};

export default Profile;