import React, { useState, useEffect } from 'react';
import { nhost } from '../lib/nhost';

const UserPosts = ({ user, currentUser }) => {
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState({});

  useEffect(() => {
    if (user?.id) {
      loadUserPosts();
    }
  }, [user?.id]);

  const loadUserPosts = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Check if this is a test user and provide sample data
      if (['user1', 'user2', 'user3'].includes(user.id)) {
        const samplePosts = getSamplePostsForUser(user.id);
        setUserPosts(samplePosts);
        setLoading(false);
        return;
      }

      const response = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
        },
        body: JSON.stringify({
          query: `query GetUserPosts($userId: uuid!) {
            posts(where: {author_id: {_eq: $userId}}, order_by: {created_at: desc}) {
              id
              image_url
              caption
              created_at
            }
            reels(where: {user_id: {_eq: $userId}}, order_by: {created_at: desc}) {
              id
              video_url
              caption
              created_at
            }
          }`,
          variables: { userId: user.id }
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.errors) {
          console.error('GraphQL errors:', result.errors);
          setUserPosts([]);
          return;
        }

        const posts = result.data?.posts || [];
        const reels = result.data?.reels || [];
        
        const allPosts = [];
        
        // Add posts
        posts.forEach(post => {
          let imageUrl = post.image_url;
          let fileType = 'image';
          
          if (post.image_url) {
            const rawUrl = String(post.image_url).trim();
            
            try {
              if (rawUrl.startsWith('[') && rawUrl.endsWith(']')) {
                const parsed = JSON.parse(rawUrl);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  imageUrl = parsed;
                  fileType = parsed.length > 1 ? 'gallery' : 'image';
                }
              } else if (rawUrl.includes(',')) {
                const urlArray = rawUrl.split(',').map(url => url.trim()).filter(url => url.length > 0);
                if (urlArray.length > 1) {
                  imageUrl = urlArray;
                  fileType = 'gallery';
                } else if (urlArray.length === 1) {
                  imageUrl = urlArray[0];
                }
              }
            } catch (e) {
              if (rawUrl.includes(',')) {
                const urlArray = rawUrl.split(',').map(url => url.trim()).filter(url => url.length > 0);
                if (urlArray.length > 1) {
                  imageUrl = urlArray;
                  fileType = 'gallery';
                } else if (urlArray.length === 1) {
                  imageUrl = urlArray[0];
                }
              }
            }
          }
          
          allPosts.push({
            id: post.id,
            type: 'post',
            imageUrl: imageUrl,
            fileType: fileType,
            caption: post.caption,
            createdAt: post.created_at
          });
        });
        
        // Add reels
        reels.forEach(reel => {
          allPosts.push({
            id: reel.id,
            type: 'reel',
            imageUrl: reel.video_url,
            fileType: 'video',
            caption: reel.caption,
            createdAt: reel.created_at
          });
        });
        
        // Sort by creation date
        allPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        setUserPosts(allPosts);
      }
    } catch (error) {
      console.error('Failed to load user posts:', error);
      setUserPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const getSamplePostsForUser = (userId) => {
    const sampleData = {
      'user1': [
        {
          id: 'post1-1',
          type: 'post',
          imageUrl: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600&h=600&fit=crop'],
          fileType: 'gallery',
          caption: 'Beautiful sunset collection from my recent travels 🌅✨',
          createdAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 'post1-2',
          type: 'post',
          imageUrl: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=600&h=600&fit=crop',
          fileType: 'image',
          caption: 'Mountain landscapes never get old 🏔️',
          createdAt: new Date(Date.now() - 172800000).toISOString()
        },
        {
          id: 'post1-3',
          type: 'post',
          imageUrl: ['https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=600&h=600&fit=crop'],
          fileType: 'gallery',
          caption: 'Nature photography series - swipe to see more! 📸🌿',
          createdAt: new Date(Date.now() - 259200000).toISOString()
        }
      ],
      'user2': [
        {
          id: 'post2-1',
          type: 'post',
          imageUrl: ['https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1f?w=600&h=600&fit=crop'],
          fileType: 'gallery',
          caption: 'Urban exploration at its finest 🏙️🔥',
          createdAt: new Date(Date.now() - 43200000).toISOString()
        },
        {
          id: 'post2-2',
          type: 'post',
          imageUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=600&h=600&fit=crop',
          fileType: 'image',
          caption: 'City lights and night vibes ✨🌃',
          createdAt: new Date(Date.now() - 129600000).toISOString()
        },
        {
          id: 'post2-3',
          type: 'post',
          imageUrl: ['https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=600&fit=crop'],
          fileType: 'gallery',
          caption: 'Architecture around the world 🌍🏢',
          createdAt: new Date(Date.now() - 216000000).toISOString()
        }
      ],
      'user3': [
        {
          id: 'post3-1',
          type: 'post',
          imageUrl: ['https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&h=600&fit=crop'],
          fileType: 'gallery',
          caption: 'Forest adventures and wildlife spotting 🌲🦌',
          createdAt: new Date(Date.now() - 21600000).toISOString()
        },
        {
          id: 'post3-2',
          type: 'post',
          imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=600&fit=crop',
          fileType: 'image',
          caption: 'Golden hour in the wilderness 🌅🍃',
          createdAt: new Date(Date.now() - 108000000).toISOString()
        },
        {
          id: 'post3-3',
          type: 'post',
          imageUrl: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=600&fit=crop'],
          fileType: 'gallery',
          caption: 'Nature collection - my favorite shots from this month! 📷🌿✨',
          createdAt: new Date(Date.now() - 194400000).toISOString()
        }
      ]
    };
    
    return sampleData[userId] || [];
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center', 
        color: '#8e8e8e' 
      }}>
        Loading posts...
      </div>
    );
  }

  if (userPosts.length === 0) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center', 
        color: '#8e8e8e' 
      }}>
        No posts yet.
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem' }}>
      <h3 style={{ color: '#fff', marginBottom: '1rem' }}>
        {user.displayName || user.username}'s Posts ({userPosts.length})
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {userPosts.map(post => (
          <div
            key={post.id}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              overflow: 'hidden'
            }}
          >
            {/* Post header */}
            <div style={{
              padding: '1rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000',
                fontWeight: 'bold',
                overflow: 'hidden'
              }}>
                {user.avatarUrl ? (
                  <img 
                    src={user.avatarUrl} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    alt={user.displayName}
                  />
                ) : (
                  (user.displayName || 'U')[0]?.toUpperCase()
                )}
              </div>
              <div>
                <div style={{ color: '#FFD700', fontWeight: '600', fontSize: '0.9rem' }}>
                  {user.displayName}
                </div>
                <div style={{ color: '#8e8e8e', fontSize: '0.7rem' }}>
                  {new Date(post.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div style={{ marginLeft: 'auto', color: '#0095f6', fontSize: '0.8rem' }}>
                {post.type === 'reel' ? '🎬 Reel' : '📷 Post'}
              </div>
            </div>

            {/* Post content */}
            <div style={{ padding: '0' }}>
              {post.imageUrl && (
                <div style={{ position: 'relative' }}>
                  {Array.isArray(post.imageUrl) && post.fileType === 'gallery' ? (
                    // Gallery with multiple images
                    <div style={{ position: 'relative' }}>
                      <div 
                        style={{
                          display: 'flex',
                          transform: `translateX(-${(currentImageIndex[post.id] || 0) * 100}%)`,
                          transition: 'transform 0.3s ease'
                        }}
                      >
                        {post.imageUrl.map((url, index) => (
                          <img 
                            key={index}
                            src={url} 
                            style={{ 
                              width: '100%', 
                              height: 'auto', 
                              maxHeight: '600px', 
                              objectFit: 'cover', 
                              flexShrink: 0,
                              display: 'block'
                            }}
                            alt={`${post.caption} - ${index + 1}`}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ))}
                      </div>
                      
                      {/* Gallery indicators */}
                      {post.imageUrl.length > 1 && (
                        <>
                          <div style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            background: 'rgba(0,0,0,0.7)',
                            borderRadius: '12px',
                            padding: '4px 8px',
                            color: '#fff',
                            fontSize: '0.7rem'
                          }}>
                            {(currentImageIndex[post.id] || 0) + 1}/{post.imageUrl.length}
                          </div>
                          
                          <div style={{
                            position: 'absolute',
                            bottom: '10px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            display: 'flex',
                            gap: '4px'
                          }}>
                            {post.imageUrl.map((_, index) => (
                              <div
                                key={index}
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  background: index === (currentImageIndex[post.id] || 0) ? '#FFD700' : 'rgba(255,255,255,0.5)',
                                  cursor: 'pointer'
                                }}
                                onClick={() => setCurrentImageIndex(prev => ({ ...prev, [post.id]: index }))}
                              />
                            ))}
                          </div>
                          
                          {/* Navigation arrows */}
                          {(currentImageIndex[post.id] || 0) > 0 && (
                            <button
                              onClick={() => setCurrentImageIndex(prev => ({ ...prev, [post.id]: (prev[post.id] || 0) - 1 }))}
                              style={{
                                position: 'absolute',
                                left: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'rgba(0,0,0,0.5)',
                                border: 'none',
                                borderRadius: '50%',
                                color: '#fff',
                                width: '30px',
                                height: '30px',
                                cursor: 'pointer',
                                fontSize: '1.2rem'
                              }}
                            >
                              ‹
                            </button>
                          )}
                          
                          {(currentImageIndex[post.id] || 0) < post.imageUrl.length - 1 && (
                            <button
                              onClick={() => setCurrentImageIndex(prev => ({ ...prev, [post.id]: (prev[post.id] || 0) + 1 }))}
                              style={{
                                position: 'absolute',
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'rgba(0,0,0,0.5)',
                                border: 'none',
                                borderRadius: '50%',
                                color: '#fff',
                                width: '30px',
                                height: '30px',
                                cursor: 'pointer',
                                fontSize: '1.2rem'
                              }}
                            >
                              ›
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    // Single image or video
                    post.fileType === 'video' ? (
                      <video 
                        src={Array.isArray(post.imageUrl) ? post.imageUrl[0] : post.imageUrl} 
                        style={{ 
                          width: '100%', 
                          height: 'auto', 
                          maxHeight: '600px', 
                          objectFit: 'cover' 
                        }} 
                        controls
                        onError={(e) => {
                          console.log('Video failed to load:', post.imageUrl);
                        }}
                      />
                    ) : (
                      <img 
                        src={Array.isArray(post.imageUrl) ? post.imageUrl[0] : post.imageUrl} 
                        style={{ 
                          width: '100%', 
                          height: 'auto', 
                          maxHeight: '600px', 
                          objectFit: 'cover',
                          display: 'block'
                        }} 
                        alt={post.caption}
                        onError={(e) => {
                          console.log('Image failed to load:', post.imageUrl);
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<div style="color: #8e8e8e; text-align: center; padding: 2rem;">📷 Image failed to load</div>';
                        }}
                      />
                    )
                  )}
                </div>
              )}
              
              {/* Caption */}
              {post.caption && (
                <div style={{
                  padding: '1rem',
                  color: '#fff',
                  fontSize: '0.95rem',
                  lineHeight: '1.4'
                }}>
                  <strong style={{ color: '#FFD700' }}>
                    {user.displayName}
                  </strong>{' '}
                  {post.caption}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserPosts;