# Reel Comments Fix Implementation Guide

## Issue Identified
The reel comments were not working because:
1. The `reels_comments` table was missing or not properly connected
2. The InstagramLayout.jsx was using the wrong GraphQL queries for reel comments
3. The reels-viewer.js had inconsistent authentication and GraphQL integration

## Files Created/Modified

### 1. Database Fix (`fix-reel-comments.sql`)
- Creates the `reels_comments` table with proper relationships
- Sets up RLS policies for security
- Creates triggers for comment count updates
- Adds notification system for reel comments

### 2. Unified Comment Component (`src/components/CommentModal.jsx`)
- Works for both posts and reels
- Proper error handling and loading states
- Real-time comment updates
- Responsive design

### 3. Fixed Reels Viewer (`js/reels-viewer-fixed.js`)
- Proper GraphQL integration
- Better error handling
- Toast notifications for user feedback
- Consistent authentication checks

## Implementation Steps

### Step 1: Run Database Migration
```sql
-- Run the fix-reel-comments.sql file in your database
-- This creates the necessary tables and relationships
```

### Step 2: Update InstagramLayout.jsx
Replace the comment modal logic in InstagramLayout.jsx with:

```jsx
import CommentModal from './components/CommentModal';

// In your component state
const [showCommentModal, setShowCommentModal] = useState(null);
const [commentContentType, setCommentContentType] = useState('post');

// For opening comments
const openComments = (contentId, contentType = 'post') => {
  setShowCommentModal(contentId);
  setCommentContentType(contentType);
};

// In your JSX
{showCommentModal && (
  <CommentModal
    isOpen={!!showCommentModal}
    onClose={() => setShowCommentModal(null)}
    contentId={showCommentModal}
    contentType={commentContentType}
    currentUser={currentUser}
  />
)}

// For reel comment buttons
<button onClick={() => openComments(reel.id, 'reel')}>
  Comment
</button>
```

### Step 3: Update Reels Section
In the reels section of InstagramLayout.jsx, replace the comment button with:

```jsx
// Comment Button for Reels
<div style={{ textAlign: 'center' }}>
  <button
    onClick={() => openComments(reelId, 'reel')}
    style={{
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '0.5rem'
    }}
  >
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  </button>
  <div style={{ color: '#fff', fontSize: '0.7rem' }}>{commentsCount}</div>
</div>
```

### Step 4: Update GraphQL Queries
Make sure your GraphQL endpoint supports these queries:

```graphql
# For loading reel comments
query GetReelComments($reelId: uuid!) {
  reels_comments(where: {reel_id: {_eq: $reelId}}, order_by: {created_at: asc}) {
    id
    content
    created_at
    user_id
    user {
      id
      displayName
      avatarUrl
    }
  }
}

# For adding reel comments
mutation AddReelComment($reelId: uuid!, $content: String!) {
  insert_reels_comments_one(object: {
    reel_id: $reelId
    content: $content
  }) {
    id
    content
    created_at
    user {
      id
      displayName
      avatarUrl
    }
  }
}
```

### Step 5: Update Authentication Integration
Make sure the `getCurrentUser()` function in reels-viewer-fixed.js returns the correct user object:

```javascript
function getCurrentUser() {
  // Return your current user object
  // This should match your authentication system
  return window.currentUser || window.nhost?.auth?.getUser();
}
```

### Step 6: Update GraphQL Client Integration
Update the `makeGraphQLRequest()` function to work with your GraphQL setup:

```javascript
async function makeGraphQLRequest(query, variables = {}) {
  // Use your GraphQL client
  if (window.nhost?.graphql?.request) {
    return await window.nhost.graphql.request(query, variables);
  }
  
  // Or use fetch for direct requests
  const response = await fetch('YOUR_GRAPHQL_ENDPOINT', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    },
    body: JSON.stringify({ query, variables })
  });
  
  return await response.json();
}
```

## Testing the Fix

1. **Database Setup**: Run the SQL migration to create the tables
2. **Comment Loading**: Test that comments load properly for reels
3. **Comment Posting**: Test that new comments can be posted
4. **Real-time Updates**: Verify that comment counts update immediately
5. **Error Handling**: Test with network issues to ensure proper error messages
6. **Authentication**: Test with logged-out users to ensure proper login prompts

## Key Features Added

- ✅ Proper reel comments table structure
- ✅ Unified comment system for posts and reels
- ✅ Real-time comment count updates
- ✅ Better error handling and user feedback
- ✅ Toast notifications for actions
- ✅ Responsive comment modal design
- ✅ Proper authentication checks
- ✅ Comment notifications system

## Troubleshooting

### Comments Not Loading
- Check if `reels_comments` table exists
- Verify GraphQL endpoint is accessible
- Check authentication token validity

### Comments Not Posting
- Verify user is authenticated
- Check RLS policies are properly set
- Ensure GraphQL mutation permissions

### UI Issues
- Check if CSS animations are loading
- Verify modal backdrop is working
- Test on different screen sizes

## Next Steps

1. Test the implementation thoroughly
2. Add comment editing/deletion features
3. Implement comment likes/replies
4. Add comment moderation features
5. Optimize for performance with large comment threads

The fix addresses the core issue of reel comments not working by creating a proper database structure and unified comment system that works consistently across the application.