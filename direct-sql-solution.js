// Alternative: Direct SQL execution approach
// Add this to your handleUpload function

const saveReelDirectSQL = async (videoUrl, caption, userId) => {
  try {
    const response = await fetch(`https://ofafvhtbuhvvkhuprotc.hasura.ap-southeast-1.nhost.run/v2/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${nhost.auth.getAccessToken()}`
      },
      body: JSON.stringify({
        type: 'run_sql',
        args: {
          sql: `INSERT INTO reels (video_url, caption, user_id) VALUES ('${videoUrl}', '${caption}', '${userId}') RETURNING *;`
        }
      })
    })
    
    const result = await response.json()
    console.log('✅ Direct SQL result:', result)
    return result
  } catch (err) {
    console.error('❌ Direct SQL failed:', err)
    return null
  }
}