import React, { useState, useEffect, useRef } from 'react';
import { formatTime, formatDate, playNotificationSound } from '../utils/helpers';

const Chat = ({ chat, currentUser, onSendMessage, onBack }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load messages for this chat
    loadMessages();
  }, [chat.partnerId]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      // Implement message loading with Nhost
      setMessages([]);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const messageText = message.trim();
    setMessage('');

    try {
      await onSendMessage(chat.partnerId, messageText);
      // Add message to local state immediately for better UX
      const newMessage = {
        id: Date.now(),
        content: messageText,
        sender_id: currentUser.id,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, newMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessage(messageText); // Restore message on error
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const renderMessages = () => {
    if (loading) {
      return <div className="loading">Loading messages...</div>;
    }

    if (messages.length === 0) {
      return (
        <div className="empty-messages">
          <div className="empty-icon">💬</div>
          <h3>No messages yet</h3>
          <p>Send a message to start the conversation</p>
        </div>
      );
    }

    let lastDate = '';
    return messages.map((msg, index) => {
      const isMe = msg.sender_id === currentUser.id;
      const messageDate = new Date(msg.created_at).toDateString();
      const showDateSeparator = messageDate !== lastDate;
      lastDate = messageDate;

      return (
        <React.Fragment key={msg.id}>
          {showDateSeparator && (
            <div className="date-separator">
              {formatDate(msg.created_at)}
            </div>
          )}
          <div className={`message-wrapper ${isMe ? 'me' : 'them'}`}>
            <div className="message">
              <div className="message-content">
                <div className="message-text">{msg.content}</div>
                <div className="message-time">
                  {formatTime(msg.created_at)}
                  {isMe && <span className="message-status">✓✓</span>}
                </div>
              </div>
            </div>
          </div>
        </React.Fragment>
      );
    });
  };

  return (
    <div className={`chat-area ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="chat-header">
        <button className="back-btn" onClick={onBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <div className="chat-avatar" style={{ width: '32px', height: '32px' }}>
            <div className="avatar-placeholder">
              {chat.partnerName?.[0]?.toUpperCase() || '?'}
            </div>
          </div>
          <div>
            <div className="chat-name" style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff' }}>
              {chat.partnerName}
            </div>
            <div style={{ fontSize: '12px', color: '#8e8e8e' }}>
              Online
            </div>
          </div>
        </div>

        <button 
          className="icon-btn" 
          onClick={toggleFullscreen} 
          title="Fullscreen Chat"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {isFullscreen ? (
              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
            ) : (
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
            )}
          </svg>
        </button>
      </div>

      <div className="whatsapp-chat">
        {renderMessages()}
        <div ref={messagesEndRef} />
      </div>

      <form className="message-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Message..."
          autoComplete="off"
        />
        <button type="submit" disabled={!message.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;