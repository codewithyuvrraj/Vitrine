import React, { useState, useEffect, useRef } from 'react';
import { uploadToCloudinary } from '../lib/cloudinary';
import { showToast } from '../utils/helpers';

const MusicSelector = ({ isOpen, onClose, onSelect }) => {
  const [musicLibrary, setMusicLibrary] = useState([]);
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [duration, setDuration] = useState(30);
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadMusicLibrary();
    }
  }, [isOpen]);

  const loadMusicLibrary = async () => {
    setLoading(true);
    try {
      // Mock data for now - replace with actual API call
      const mockMusic = [
        { id: 1, title: 'Summer Vibes', artist: 'DJ Cool', url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', duration: 180 },
        { id: 2, title: 'Chill Beat', artist: 'Lo-Fi Master', url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', duration: 120 }
      ];
      setMusicLibrary(mockMusic);
    } catch (error) {
      showToast('Failed to load music library', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      showToast('Please select an audio file', 'error');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      showToast('File too large. Maximum size is 50MB', 'error');
      return;
    }

    setLoading(true);
    try {
      const url = await uploadToCloudinary(file, 'audio');
      
      const audio = new Audio(url);
      audio.addEventListener('loadedmetadata', () => {
        const newMusic = {
          id: Date.now(),
          title: file.name.replace(/\.[^/.]+$/, ""),
          artist: 'Uploaded',
          url: url,
          duration: audio.duration
        };
        
        setMusicLibrary(prev => [newMusic, ...prev]);
        showToast('Music uploaded successfully!');
      });
    } catch (error) {
      showToast('Failed to upload music', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectMusic = (music) => {
    setSelectedMusic(music);
    setStartTime(0);
    setDuration(Math.min(30, music.duration));
  };

  const previewTrim = () => {
    if (audioRef.current && selectedMusic) {
      audioRef.current.currentTime = startTime;
      audioRef.current.play();
      
      setTimeout(() => {
        audioRef.current.pause();
      }, duration * 1000);
    }
  };

  const confirmSelection = () => {
    if (selectedMusic) {
      onSelect({
        ...selectedMusic,
        startTime,
        trimDuration: duration
      });
      onClose();
    }
  };

  const filteredMusic = musicLibrary.filter(music =>
    music.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    music.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-backdrop" onClick={onClose}></div>
      <div className="modal-dialog" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h3>Add Music</h3>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        
        <div className="modal-body" style={{ padding: '20px' }}>
          {/* Upload Section */}
          <div style={{ marginBottom: '20px' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="upload-btn"
              disabled={loading}
              style={{ width: '100%', padding: '12px', marginBottom: '15px' }}
            >
              {loading ? 'Uploading...' : '📁 Upload Music from Device'}
            </button>
          </div>

          {/* Search */}
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Search music..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
            />
          </div>

          {/* Music Library */}
          <div style={{ marginBottom: '20px' }}>
            <h4>Your Music Library</h4>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
              ) : filteredMusic.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                  {searchTerm ? 'No music found' : 'No music in your library'}
                </div>
              ) : (
                filteredMusic.map(music => (
                  <div
                    key={music.id}
                    onClick={() => selectMusic(music)}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      marginBottom: '8px',
                      background: selectedMusic?.id === music.id ? '#0095f6' : 'rgba(255,255,255,0.05)',
                      color: selectedMusic?.id === music.id ? 'white' : 'inherit',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
                  >
                    <div style={{ fontWeight: '600' }}>{music.title}</div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                      {music.artist} • {Math.floor(music.duration)}s
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Music Preview */}
          {selectedMusic && (
            <div style={{ 
              padding: '15px', 
              background: 'rgba(255,255,255,0.1)', 
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontWeight: '600' }}>{selectedMusic.title}</div>
                  <div style={{ color: '#8e8e8e', fontSize: '0.9rem' }}>{selectedMusic.artist}</div>
                </div>
                <button 
                  onClick={() => setSelectedMusic(null)}
                  style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                >
                  Remove
                </button>
              </div>
              
              <audio 
                ref={audioRef}
                src={selectedMusic.url} 
                controls 
                style={{ width: '100%', marginBottom: '10px' }}
              />
              
              <div style={{ marginBottom: '15px' }}>
                <div style={{ marginBottom: '10px', fontWeight: '500' }}>Trim Music (30 seconds max):</div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    Start:
                    <input
                      type="number"
                      min="0"
                      max={selectedMusic.duration}
                      step="0.1"
                      value={startTime}
                      onChange={(e) => setStartTime(parseFloat(e.target.value))}
                      style={{ width: '80px', padding: '4px' }}
                    />
                    sec
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    Duration:
                    <input
                      type="number"
                      min="1"
                      max="30"
                      step="0.1"
                      value={duration}
                      onChange={(e) => setDuration(parseFloat(e.target.value))}
                      style={{ width: '80px', padding: '4px' }}
                    />
                    sec
                  </label>
                  <button onClick={previewTrim} style={{ padding: '4px 8px' }}>
                    Preview
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button 
              onClick={confirmSelection}
              className="save-btn"
              disabled={!selectedMusic}
            >
              Use This Music
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicSelector;