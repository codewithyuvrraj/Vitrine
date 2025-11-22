import { useState, useEffect, useCallback } from 'react';
import { nhost } from '../lib/nhost';
import { showToast } from '../utils/helpers';

export const useInstagram = (user) => {
  const [posts, setPosts] = useState([]);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentChat, setCurrentChat] = useState(null);

  // Load feed posts
  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      // Example GraphQL query for posts
      const query = `
        query GetPosts {
          posts(order_by: {created_at: desc}, limit: 20) {
            id
            caption
            image_url
            audience
            created_at
            user_id
            user {
              id
              displayName
              avatarUrl
            }
          }
        }
      `;
      
      const { data, error } = await nhost.graphql.request(query);
      
      if (error) {
        throw new Error(error.message);
      }
      
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Error loading feed:', error);
      showToast('Error loading posts', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load chats
  const loadChats = useCallback(async () => {
    if (!user) return;
    
    try {
      // Example GraphQL query for messages to get chat partners
      const query = `
        query GetChats($userId: uuid!) {
          messages(
            where: {
              _or: [
                {sender_id: {_eq: $userId}},
                {receiver_id: {_eq: $userId}}
              ]
            }
            distinct_on: [sender_id, receiver_id]
            order_by: [{sender_id: desc}, {receiver_id: desc}, {created_at: desc}]
          ) {
            sender_id
            receiver_id
            content
            created_at
            sender {
              id
              displayName
              avatarUrl
            }
            receiver {
              id
              displayName
              avatarUrl
            }
          }
        }
      `;
      
      const { data, error } = await nhost.graphql.request(query, {
        userId: user.id
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Process messages to create chat list
      const chatMap = new Map();
      
      data.messages?.forEach(message => {
        const partnerId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
        const partner = message.sender_id === user.id ? message.receiver : message.sender;
        
        if (partnerId !== user.id && !chatMap.has(partnerId)) {
          chatMap.set(partnerId, {
            partnerId,
            partnerName: partner.displayName,
            partnerAvatar: partner.avatarUrl,
            lastMessage: message.content,
            lastMessageTime: message.created_at
          });
        }
      });
      
      setChats(Array.from(chatMap.values()));
    } catch (error) {
      console.error('Error loading chats:', error);
      showToast('Error loading chats', 'error');
    }
  }, [user]);

  // Create post
  const createPost = useCallback(async (postData) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      let imageUrl = null;
      
      // Upload image if provided
      if (postData.file) {
        const { fileMetadata, error: uploadError } = await nhost.storage.upload({
          file: postData.file,
          bucketId: 'default'
        });
        
        if (uploadError) {
          throw new Error(uploadError.message);
        }
        
        imageUrl = nhost.storage.getPublicUrl({
          fileId: fileMetadata.id
        });
      }
      
      // Create post in database
      const mutation = `
        mutation CreatePost($object: posts_insert_input!) {
          insert_posts_one(object: $object) {
            id
            caption
            image_url
            audience
            created_at
            user_id
          }
        }
      `;
      
      const { data, error } = await nhost.graphql.request(mutation, {
        object: {
          user_id: user.id,
          caption: postData.caption || null,
          image_url: imageUrl,
          audience: postData.audience || 'public'
        }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Refresh feed
      await loadFeed();
      
      return data.insert_posts_one;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }, [user, loadFeed]);

  // Send message
  const sendMessage = useCallback(async (receiverId, content) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const mutation = `
        mutation SendMessage($object: messages_insert_input!) {
          insert_messages_one(object: $object) {
            id
            content
            sender_id
            receiver_id
            created_at
          }
        }
      `;
      
      const { data, error } = await nhost.graphql.request(mutation, {
        object: {
          sender_id: user.id,
          receiver_id: receiverId,
          content: content
        }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data.insert_messages_one;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }, [user]);

  // Search users
  const searchUsers = useCallback(async (query) => {
    if (!query.trim()) return [];
    
    try {
      const searchQuery = `
        query SearchUsers($search: String!) {
          users(
            where: {
              displayName: {_ilike: $search}
            }
            limit: 20
          ) {
            id
            displayName
            avatarUrl
            email
          }
        }
      `;
      
      const { data, error } = await nhost.graphql.request(searchQuery, {
        search: `%${query}%`
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data.users || [];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }, []);

  // Like post
  const likePost = useCallback(async (postId) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      // Check if already liked
      const checkQuery = `
        query CheckLike($postId: uuid!, $userId: uuid!) {
          likes(where: {post_id: {_eq: $postId}, user_id: {_eq: $userId}}) {
            id
          }
        }
      `;
      
      const { data: checkData } = await nhost.graphql.request(checkQuery, {
        postId,
        userId: user.id
      });
      
      if (checkData.likes.length > 0) {
        // Unlike
        const unlikeMutation = `
          mutation UnlikePost($postId: uuid!, $userId: uuid!) {
            delete_likes(where: {post_id: {_eq: $postId}, user_id: {_eq: $userId}}) {
              affected_rows
            }
          }
        `;
        
        await nhost.graphql.request(unlikeMutation, {
          postId,
          userId: user.id
        });
      } else {
        // Like
        const likeMutation = `
          mutation LikePost($object: likes_insert_input!) {
            insert_likes_one(object: $object) {
              id
            }
          }
        `;
        
        await nhost.graphql.request(likeMutation, {
          object: {
            post_id: postId,
            user_id: user.id
          }
        });
      }
    } catch (error) {
      console.error('Error liking post:', error);
      throw error;
    }
  }, [user]);

  // Delete post
  const deletePost = useCallback(async (postId) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const mutation = `
        mutation DeletePost($postId: uuid!, $userId: uuid!) {
          delete_posts(where: {id: {_eq: $postId}, user_id: {_eq: $userId}}) {
            affected_rows
          }
        }
      `;
      
      const { data, error } = await nhost.graphql.request(mutation, {
        postId,
        userId: user.id
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Refresh feed
      await loadFeed();
      
      return data.delete_posts.affected_rows > 0;
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }, [user, loadFeed]);

  // Load initial data
  useEffect(() => {
    if (user) {
      loadFeed();
      loadChats();
    }
  }, [user, loadFeed, loadChats]);

  return {
    // State
    posts,
    chats,
    loading,
    currentChat,
    
    // Actions
    loadFeed,
    loadChats,
    createPost,
    sendMessage,
    searchUsers,
    likePost,
    deletePost,
    setCurrentChat,
    
    // Utilities
    refreshData: () => {
      loadFeed();
      loadChats();
    }
  };
};