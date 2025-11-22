// Quick fix for comment deletion issue
// Add this to your InstagramLayout.jsx

// Update the loadRealComments function to handle both posts and reels
const loadRealComments = async () => {
  try {
    // Load regular post comments
    const postCommentsResponse = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
      },
      body: JSON.stringify({
        query: `query GetComments {
          comments {
            post_id
            author_id
            text
            created_at
            profile {
              display_name
              avatar_url
            }
          }
        }`
      })
    })

    // Load reel comments
    const reelCommentsResponse = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
      },
      body: JSON.stringify({
        query: `query GetReelComments {
          reels_comments {
            reel_id
            user_id
            content
            created_at
          }
        }`
      })
    })

    if (postCommentsResponse.ok && reelCommentsResponse.ok) {
      const postResult = await postCommentsResponse.json()
      const reelResult = await reelCommentsResponse.json()
      
      const postCommentsData = postResult.data?.comments || []
      const reelCommentsData = reelResult.data?.reels_comments || []
      
      // Count comments per post/reel
      const commentCounts = {}
      const commentsByPost = {}
      
      // Process post comments
      postCommentsData.forEach(comment => {
        if (comment.post_id) {
          commentCounts[comment.post_id] = (commentCounts[comment.post_id] || 0) + 1
          if (!commentsByPost[comment.post_id]) {
            commentsByPost[comment.post_id] = []
          }
          commentsByPost[comment.post_id].push({
            ...comment,
            userName: comment.profile?.display_name || 'User'
          })
        }
      })
      
      // Process reel comments
      reelCommentsData.forEach(comment => {
        if (comment.reel_id) {
          commentCounts[comment.reel_id] = (commentCounts[comment.reel_id] || 0) + 1
          if (!commentsByPost[comment.reel_id]) {
            commentsByPost[comment.reel_id] = []
          }
          commentsByPost[comment.reel_id].push({
            ...comment,
            post_id: comment.reel_id, // Map reel_id to post_id for consistency
            text: comment.content,
            author_id: comment.user_id,
            userName: 'User' // You might want to fetch user details here
          })
        }
      })
      
      setPostComments(commentCounts)
      setCommentDetails(commentsByPost)
    }
  } catch (error) {
    console.error('❌ Failed to load comments:', error)
  }
}

// Update the comment modal to handle reel comments properly
const addComment = async (contentId, commentText, contentType = 'post') => {
  if (!currentUser?.id || !commentText.trim()) return

  try {
    const profileResponse = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
      },
      body: JSON.stringify({
        query: `query GetProfileId($authId: uuid!) {
          profiles(where: {auth_id: {_eq: $authId}}) {
            id
          }
        }`,
        variables: { authId: currentUser.id }
      })
    })
    
    const profileResult = await profileResponse.json()
    const profileId = profileResult.data?.profiles?.[0]?.id
    
    if (!profileId) throw new Error('Profile not found')

    let mutation, variables
    
    if (contentType === 'reel') {
      // Add to reels_comments table
      mutation = `mutation AddReelComment($reelId: uuid!, $userId: uuid!, $content: String!) {
        insert_reels_comments_one(object: {
          reel_id: $reelId,
          user_id: $userId,
          content: $content
        }) {
          id
          created_at
        }
      }`
      variables = { reelId: contentId, userId: currentUser.id, content: commentText.trim() }
    } else {
      // Add to comments table
      mutation = `mutation AddComment($postId: uuid!, $authorId: uuid!, $text: String!) {
        insert_comments_one(object: {
          post_id: $postId,
          author_id: $authorId,
          text: $text
        }) {
          id
          created_at
        }
      }`
      variables = { postId: contentId, authorId: profileId, text: commentText.trim() }
    }

    const response = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
      },
      body: JSON.stringify({ query: mutation, variables })
    })

    const result = await response.json()
    
    if (result.errors) {
      throw new Error(result.errors[0].message)
    }

    // Update comment count immediately
    setPostComments(prev => ({
      ...prev,
      [contentId]: (prev[contentId] || 0) + 1
    }))

    // Don't reload all comments, just add the new one locally
    setCommentDetails(prev => ({
      ...prev,
      [contentId]: [
        ...(prev[contentId] || []),
        {
          id: result.data?.insert_comments_one?.id || result.data?.insert_reels_comments_one?.id,
          text: commentText.trim(),
          content: commentText.trim(),
          author_id: currentUser.id,
          user_id: currentUser.id,
          post_id: contentId,
          reel_id: contentId,
          created_at: new Date().toISOString(),
          userName: currentUser.displayName
        }
      ]
    }))

    return true
  } catch (error) {
    console.error('Comment error:', error)
    return false
  }
}