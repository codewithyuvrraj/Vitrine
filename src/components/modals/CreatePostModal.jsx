import React, { useState } from 'react';
import { handleFileUpload, createImagePreview, showToast } from '../../utils/helpers';
import MusicSelector from '../MusicSelector';

const CreatePostModal = ({ isOpen, onClose, onSubmit }) => {
  const [caption, setCaption] = useState('');
  const [audience, setAudience] = useState('public');
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [showMusicSelector, setShowMusicSelector] = useState(false);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const dataUrl = await handleFileUpload(file);
      setSelectedFile(file);
      setPreview(dataUrl);
    } catch (error) {
      showToast('Error loading file', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile && !caption.trim()) {
      showToast('Please add an image or caption', 'error');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        caption: caption.trim(),
        audience,
        file: selectedFile,
        preview,
        music: selectedMusic
      });
      
      // Reset form
      setCaption('');
      setAudience('public');
      setSelectedFile(null);
      setPreview('');
      setSelectedMusic(null);
      onClose();
      showToast('Post shared successfully!');
    } catch (error) {
      showToast('Failed to create post', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-backdrop" onClick={onClose}></div>
      <div className="modal-dialog">
        <div className="modal-header">
          <h3>Create Post</h3>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <label>
            Media
            <button 
              type="button" 
              onClick={() => document.getElementById('postImage').click()}
              className="upload-btn"
            >
              Choose Photo/Video
            </button>
            <input 
              type="file" 
              id="postImage" 
              accept="image/*,video/*" 
              onChange={handleFileSelect}
              style={{ display: 'none' }} 
            />
            {selectedFile && (
              <div style={{ marginTop: '8px', fontSize: '0.9em', color: '#666' }}>
                Selected: {selectedFile.name}
              </div>
            )}
          </label>
          
          {preview && (
            <div className="media-preview">
              {selectedFile?.type.startsWith('image/') ? (
                <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }} />
              ) : (
                <video src={preview} controls style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }} />
              )}
            </div>
          )}
          
          <label>
            Caption
            <textarea 
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows="3" 
              placeholder="Write a caption..."
            />
          </label>
          
          <label>
            Audience
            <select value={audience} onChange={(e) => setAudience(e.target.value)}>
              <option value="public">Public</option>
              <option value="followers">Followers only</option>
              <option value="close_friends">Close friends</option>
            </select>
          </label>
          
          <div style={{ marginTop: '15px' }}>
            <button 
              type="button" 
              onClick={() => setShowMusicSelector(true)}
              style={{
                padding: '10px 15px',
                borderRadius: '8px',
                border: 'none',
                background: selectedMusic ? '#0095f6' : 'rgba(255,255,255,0.1)',
                color: selectedMusic ? 'white' : 'inherit',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              {selectedMusic ? `🎵 ${selectedMusic.title}` : '🎵 Add Music'}
            </button>
            {selectedMusic && (
              <div style={{ marginTop: '5px', fontSize: '0.9em', color: '#666' }}>
                {selectedMusic.artist} • {selectedMusic.trimDuration}s
              </div>
            )}
          </div>
          
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? 'Sharing...' : 'Share'}
            </button>
          </div>
        </form>
        
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

export default CreatePostModal;