import React, { useState } from 'react';
import { handleFileUpload, showToast } from '../../utils/helpers';

const CreateReelModal = ({ isOpen, onClose, onSubmit }) => {
  const [caption, setCaption] = useState('');
  const [audience, setAudience] = useState('public');
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      showToast('Please select a video file', 'error');
      return;
    }

    try {
      const dataUrl = await handleFileUpload(file);
      setSelectedFile(file);
      setPreview(dataUrl);
    } catch (error) {
      showToast('Error loading video', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      showToast('Please select a video file', 'error');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        caption: caption.trim(),
        audience,
        file: selectedFile,
        preview
      });
      
      // Reset form
      setCaption('');
      setAudience('public');
      setSelectedFile(null);
      setPreview('');
      onClose();
      showToast('Reel shared successfully!');
    } catch (error) {
      showToast('Failed to share reel', 'error');
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
          <h3>Create Reel</h3>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <label>
            Video
            <button 
              type="button" 
              onClick={() => document.getElementById('reelVideo').click()}
              className="upload-btn"
            >
              Choose Video
            </button>
            <input 
              type="file" 
              id="reelVideo" 
              accept="video/*" 
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
              <video src={preview} controls style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }} />
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
          
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? 'Sharing...' : 'Share Reel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateReelModal;