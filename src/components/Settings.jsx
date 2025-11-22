import React, { useState } from 'react';
import { uploadToCloudinary } from '../lib/cloudinary';

const Settings = ({ user }) => {
  const [uploadingSong, setUploadingSong] = useState(false);
  const [uploadedSongs, setUploadedSongs] = useState([]);

  const handleSongUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      alert('Please select an audio file');
      return;
    }

    setUploadingSong(true);
    try {
      const url = await uploadToCloudinary(file, 'audio');
      const newSong = {
        id: Date.now(),
        name: file.name,
        url: url,
        uploadedAt: new Date().toISOString()
      };
      
      setUploadedSongs(prev => [newSong, ...prev]);
      alert('Song uploaded successfully!');
      
      // Reset file input
      event.target.value = '';
    } catch (error) {
      console.error('Song upload failed:', error);
      alert('Failed to upload song. Please try again.');
    } finally {
      setUploadingSong(false);
    }
  };

  const handleMultipleSongUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    const audioFiles = files.filter(file => file.type.startsWith('audio/'));
    if (audioFiles.length === 0) {
      alert('Please select audio files');
      return;
    }

    setUploadingSong(true);
    try {
      const uploadedSongs = [];
      
      for (const file of audioFiles) {
        const url = await uploadToCloudinary(file, 'audio');
        const newSong = {
          id: Date.now() + Math.random(),
          name: file.name,
          url: url,
          uploadedAt: new Date().toISOString()
        };
        uploadedSongs.push(newSong);
      }
      
      setUploadedSongs(prev => [...uploadedSongs, ...prev]);
      alert(`Successfully uploaded ${uploadedSongs.length} songs!`);
      
      // Reset file input
      event.target.value = '';
    } catch (error) {
      console.error('Multiple song upload failed:', error);
      alert('Failed to upload songs. Please try again.');
    } finally {
      setUploadingSong(false);
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2 style={{ color: '#fff', marginBottom: '2rem' }}>Settings</h2>
      
      {/* Upload Songs Section */}
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <h3 style={{ color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🎵 Upload Songs
        </h3>
        
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <label style={{ 
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            background: uploadingSong ? '#666' : '#0095f6',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            cursor: uploadingSong ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: '500'
          }}>
            {uploadingSong ? '🎵 Uploading...' : '🎵 Choose Song to Upload'}
            <input
              type="file"
              accept="audio/*"
              onChange={handleSongUpload}
              disabled={uploadingSong}
              style={{ display: 'none' }}
            />
          </label>
          
          <label style={{ 
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            background: uploadingSong ? '#666' : '#28a745',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            cursor: uploadingSong ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: '500'
          }}>
            {uploadingSong ? '🎵 Uploading...' : '🎵 Upload Multiple Songs'}
            <input
              type="file"
              accept="audio/*"
              multiple
              onChange={handleMultipleSongUpload}
              disabled={uploadingSong}
              style={{ display: 'none' }}
            />
          </label>
        </div>
        
        <p style={{ color: '#8e8e8e', fontSize: '0.9rem', margin: 0 }}>
          Supported formats: MP3, WAV, M4A, OGG • Upload single or multiple songs at once
        </p>
      </div>

      {/* Uploaded Songs List */}
      {uploadedSongs.length > 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '1.5rem'
        }}>
          <h3 style={{ color: '#fff', marginBottom: '1rem' }}>
            📚 Your Uploaded Songs ({uploadedSongs.length})
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {uploadedSongs.map(song => (
              <div key={song.id} style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '8px',
                padding: '1rem',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '0.5rem'
                }}>
                  <h4 style={{ color: '#fff', margin: 0, fontSize: '1rem' }}>
                    🎵 {song.name}
                  </h4>
                  <span style={{ color: '#8e8e8e', fontSize: '0.8rem' }}>
                    {new Date(song.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
                
                <audio controls style={{ width: '100%', marginBottom: '0.5rem' }}>
                  <source src={song.url} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
                
                <div style={{ fontSize: '0.8rem', color: '#8e8e8e' }}>
                  Stored in Cloudinary Database
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;