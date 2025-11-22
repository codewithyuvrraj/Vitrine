// Test mutations directly
const testMutations = async () => {
  const testUserId = 'ab1b1241-903c-4ac3-acf9-8033e22cce5b'
  const testPostId = '4e95ef68-e7a4-4400-85f1-4eece0ca6c45'
  
  console.log('Testing like mutation...')
  try {
    const likeResponse = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
      },
      body: JSON.stringify({
        query: `mutation AddLike($userId: String!, $postId: String!) {
          insert_likes_one(object: {user_id: $userId, post_id: $postId}) {
            id
          }
        }`,
        variables: {
          userId: testUserId,
          postId: testPostId
        }
      })
    })
    
    const likeResult = await likeResponse.json()
    console.log('Like result:', JSON.stringify(likeResult, null, 2))
  } catch (error) {
    console.error('Like error:', error)
  }
  
  console.log('\nTesting comment mutation...')
  try {
    const commentResponse = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
      },
      body: JSON.stringify({
        query: `mutation AddComment($userId: String!, $postId: String!, $content: String!) {
          insert_comments_one(object: {author_id: $userId, post_id: $postId, text: $content}) {
            id
          }
        }`,
        variables: {
          userId: testUserId,
          postId: testPostId,
          content: 'test comment'
        }
      })
    })
    
    const commentResult = await commentResponse.json()
    console.log('Comment result:', JSON.stringify(commentResult, null, 2))
  } catch (error) {
    console.error('Comment error:', error)
  }
}

testMutations()