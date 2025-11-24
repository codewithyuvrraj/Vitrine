import React, { useState, useEffect, useRef } from 'react';
import { uploadToCloudinary } from '../lib/cloudinary';
import MusicSelector from './MusicSelector';

const UploadModal = ({ isOpen, onClose, uploadType, onSubmit }) => {
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [showMusicSelector, setShowMusicSelector] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadedMusic, setUploadedMusic] = useState([]);
  const [musicSearchQuery, setMusicSearchQuery] = useState('');
  const [showMusicSearch, setShowMusicSearch] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleMusicUpload = async (files) => {
    if (!files || files.length === 0) return;
    
    const audioFiles = Array.from(files).filter(file => file.type.startsWith('audio/'));
    if (audioFiles.length === 0) {
      alert('Please select audio files');
      return;
    }
    
    setLoading(true);
    try {
      const newMusic = [];
      for (const file of audioFiles) {
        const url = await uploadToCloudinary(file, 'audio');
        newMusic.push({
          id: Date.now() + Math.random(),
          name: file.name.replace(/\.[^/.]+$/, ''),
          url: url,
          duration: '0:00'
        });
      }
      
      setUploadedMusic(prev => [...prev, ...newMusic]);
      alert(`Successfully uploaded ${audioFiles.length} song(s)!`);
    } catch (error) {
      console.error('Music upload failed:', error);
      alert('Failed to upload music. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('uploadedMusic');
    if (saved) {
      setUploadedMusic(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('uploadedMusic', JSON.stringify(uploadedMusic));
  }, [uploadedMusic]);

  const filteredMusic = uploadedMusic.filter(music =>
    music.name.toLowerCase().includes(musicSearchQuery.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      alert('Please select a file');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        caption: caption.trim(),
        file: selectedFile,
        type: uploadType,
        music: selectedMusic
      });
      
      // Reset form
      setCaption('');
      setSelectedFile(null);
      setPreview('');
      setSelectedMusic(null);
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'rgba(0,0,0,0.95)',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto',
        border: '1px solid rgba(255,215,0,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ color: '#FFD700', margin: 0 }}>
            Create {uploadType === 'story' ? 'Story' : uploadType === 'reel' ? 'Reel' : 'Post'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#FFD700', fontSize: '1.5rem', cursor: 'pointer' }}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* File Upload */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ color: '#FFD700', display: 'block', marginBottom: '0.5rem' }}>
              {uploadType === 'story' ? 'Photo/Video' : uploadType === 'reel' ? 'Video' : 'Photo/Video'}
            </label>
            <input
              type="file"
              accept={uploadType === 'reel' ? 'video/*' : 'image/*,video/*'}
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="fileInput"
            />
            <button
              type="button"
              onClick={() => document.getElementById('fileInput').click()}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(255,215,0,0.1)',
                border: '1px solid rgba(255,215,0,0.3)',
                borderRadius: '8px',
                color: '#FFD700',
                cursor: 'pointer'
              }}
            >
              Choose {uploadType === 'reel' ? 'Video' : 'File'}
            </button>
            {selectedFile && (
              <div style={{ marginTop: '8px', fontSize: '0.9em', color: '#666' }}>
                Selected: {selectedFile.name}
              </div>
            )}
          </div>

          {/* Preview */}
          {preview && (
            <div style={{ marginBottom: '1.5rem' }}>
              {selectedFile?.type.startsWith('video/') ? (
                <video src={preview} controls style={{ width: '100%', maxHeight: '200px', borderRadius: '8px' }} />
              ) : (
                <img src={preview} alt="Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px' }} />
              )}
            </div>
          )}

          {/* Music Section */}
          {(uploadType === 'reel' || uploadType === 'story' || uploadType === 'post') && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowMusicSearch(!showMusicSearch)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'rgba(255,215,0,0.1)',
                    border: '1px solid rgba(255,215,0,0.3)',
                    borderRadius: '8px',
                    color: '#FFD700',
                    cursor: 'pointer'
                  }}
                >
                  🎵 {showMusicSearch ? 'Hide Music' : 'Add Music'}
                </button>
                <input
                  type="file"
                  multiple
                  accept="audio/*"
                  onChange={(e) => handleMusicUpload(e.target.files)}
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: '12px',
                    background: 'rgba(255,215,0,0.1)',
                    border: '1px solid rgba(255,215,0,0.3)',
                    borderRadius: '8px',
                    color: '#FFD700',
                    cursor: 'pointer'
                  }}
                >
                  📁 Upload
                </button>
              </div>
              
              {showMusicSearch && (
                <div style={{
                  background: 'rgba(255,215,0,0.05)',
                  border: '1px solid rgba(255,215,0,0.2)',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '12px'
                }}>
                  <input
                    type="text"
                    placeholder="Search your uploaded music..."
                    value={musicSearchQuery}
                    onChange={(e) => setMusicSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'rgba(255,215,0,0.1)',
                      border: '1px solid rgba(255,215,0,0.3)',
                      borderRadius: '6px',
                      color: '#FFD700',
                      marginBottom: '12px'
                    }}
                  />
                  
                  <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                    {filteredMusic.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
                        {musicSearchQuery ? 'No music found' : 'No music uploaded yet. Click "Upload" to add songs.'}
                      </div>
                    ) : (
                      filteredMusic.map((music) => (
                        <div
                          key={music.id}
                          onClick={() => {
                            setSelectedMusic(music);
                            setShowMusicSearch(false);
                          }}
                          style={{
                            padding: '8px 12px',
                            background: selectedMusic?.id === music.id ? 'rgba(255,215,0,0.2)' : 'rgba(255,215,0,0.05)',
                            border: '1px solid rgba(255,215,0,0.2)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            marginBottom: '6px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div>
                            <div style={{ color: '#FFD700', fontWeight: '500' }}>{music.name}</div>
                            <div style={{ color: '#888', fontSize: '0.8rem' }}>{music.duration}</div>
                          </div>
                          <div style={{ color: '#FFD700' }}>🎵</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
              
              {selectedMusic && (
                <div style={{
                  background: 'rgba(0,150,246,0.1)',
                  border: '1px solid rgba(0,150,246,0.3)',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ color: '#0096f6', fontWeight: '500' }}>🎵 {selectedMusic.name}</div>
                    <div style={{ color: '#888', fontSize: '0.8rem' }}>{selectedMusic.duration}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedMusic(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ff4444',
                      cursor: 'pointer',
                      fontSize: '1.2rem'
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Caption */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ color: '#FFD700', display: 'block', marginBottom: '0.5rem' }}>
              Caption
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows="3"
              placeholder="Write a caption..."
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(255,215,0,0.1)',
                border: '1px solid rgba(255,215,0,0.3)',
                borderRadius: '8px',
                color: '#FFD700',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 24px',
                background: 'none',
                border: '1px solid rgba(255,215,0,0.3)',
                borderRadius: '8px',
                color: '#FFD700',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedFile}
              style={{
                padding: '12px 24px',
                background: loading || !selectedFile ? '#666' : '#FFD700',
                border: 'none',
                borderRadius: '8px',
                color: '#000',
                cursor: loading || !selectedFile ? 'not-allowed' : 'pointer',
                fontWeight: 'bold'
              }}
            >
              {loading ? 'Uploading...' : 'Share'}
            </button>
          </div>
        </form>

        {/* Music Selector Modal */}
        <MusicSelector
          isOpen={showMusicSelector}
          onClose={() => setShowMusicSelector(false)}
          onSelect={(music) => {
            setSelectedMusic(music);
            setShowMusicSelector(false);
          }}
        />
      </div>
    </div>
  );
};

export default UploadModal;