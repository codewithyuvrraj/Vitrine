import React, { useEffect, useState } from 'react'
import { nhost } from '../lib/nhost'

const Chat = () => {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)

  const loadMessages = async (userId) => {
    if (!userId) return
    
    const query = `
      query($user_id: uuid!, $current_user: uuid!) {
        messages(
          where: {
            _or: [
              {_and: [{sender_id: {_eq: $current_user}}, {receiver_id: {_eq: $user_id}}]},
              {_and: [{sender_id: {_eq: $user_id}}, {receiver_id: {_eq: $current_user}}]}
            ]
          },
          order_by: {created_at: asc}
        ) {
          id
          content
          sender_id
          receiver_id
          created_at
        }
      }
    `
    
    const res = await nhost.graphql.request(query, {
      user_id: userId,
      current_user: nhost.auth.getUser()?.id
    })
    
    setMessages(res.data?.messages || [])
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedUser) return

    const mutation = `
      mutation($content: String!, $sender_id: uuid!, $receiver_id: uuid!) {
        insert_messages_one(object: {
          content: $content,
          sender_id: $sender_id,
          receiver_id: $receiver_id
        }) {
          id
        }
      }
    `
    
    await nhost.graphql.request(mutation, {
      content: newMessage,
      sender_id: nhost.auth.getUser()?.id,
      receiver_id: selectedUser
    })
    
    setNewMessage('')
    loadMessages(selectedUser)
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Chat</h2>
      
      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ width: 200 }}>
          <h3>Users</h3>
          <p>Select a user to chat with</p>
        </div>
        
        <div style={{ flex: 1 }}>
          {selectedUser ? (
            <>
              <div style={{ height: 300, border: '1px solid #ccc', padding: 10, overflowY: 'scroll' }}>
                {messages.map(msg => (
                  <div key={msg.id} style={{ 
                    marginBottom: 10,
                    textAlign: msg.sender_id === nhost.auth.getUser()?.id ? 'right' : 'left'
                  }}>
                    <div style={{
                      display: 'inline-block',
                      padding: '5px 10px',
                      backgroundColor: msg.sender_id === nhost.auth.getUser()?.id ? '#007bff' : '#f1f1f1',
                      color: msg.sender_id === nhost.auth.getUser()?.id ? 'white' : 'black',
                      borderRadius: 10
                    }}>
                      {msg.content}
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
              
              <form onSubmit={sendMessage} style={{ marginTop: 10 }}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  style={{ width: '80%' }}
                />
                <button type="submit">Send</button>
              </form>
            </>
          ) : (
            <p>Select a user to start chatting</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Chat