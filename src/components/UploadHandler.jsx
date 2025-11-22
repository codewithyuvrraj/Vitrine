// Upload handler functions for InstagramLayout
export const handleUploadSubmit = async (uploadData, currentUser, setPosts, setUploadProgress) => {
  if (!currentUser?.id) {
    alert('Please log in to upload');
    return;
  }

  setUploadProgress({ isUploading: true, message: 'Uploading...', startTime: Date.now() });

  try {
    // Get user profile ID
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
    });

    const profileResult = await profileResponse.json();
    const profileId = profileResult.data?.profiles?.[0]?.id;

    if (!profileId) {
      throw new Error('Profile not found');
    }

    let mutation, variables;

    if (uploadData.type === 'reel') {
      mutation = `mutation CreateReel($userId: uuid!, $videoUrl: String!, $caption: String, $musicData: jsonb) {
        insert_reels_one(object: {
          user_id: $userId,
          video_url: $videoUrl,
          caption: $caption,
          music_data: $musicData
        }) {
          id
          video_url
          caption
          user_id
          created_at
        }
      }`;
      
      variables = {
        userId: currentUser.id,
        videoUrl: uploadData.fileUrl,
        caption: uploadData.caption,
        musicData: uploadData.music ? JSON.stringify(uploadData.music) : null
      };
    } else if (uploadData.type === 'story') {
      mutation = `mutation CreateStory($userId: uuid!, $storagePath: String!, $musicData: jsonb) {
        insert_stories_one(object: {
          user_id: $userId,
          storage_path: $storagePath,
          music_data: $musicData
        }) {
          id
          user_id
          storage_path
          created_at
        }
      }`;
      
      variables = {
        userId: currentUser.id,
        storagePath: uploadData.fileUrl,
        musicData: uploadData.music ? JSON.stringify(uploadData.music) : null
      };
    } else {
      // Regular post
      mutation = `mutation CreatePost($authorId: uuid!, $imageUrl: String!, $caption: String, $musicData: jsonb) {
        insert_posts_one(object: {
          author_id: $authorId,
          image_url: $imageUrl,
          caption: $caption,
          music_data: $musicData
        }) {
          id
          image_url
          caption
          author_id
          created_at
        }
      }`;
      
      variables = {
        authorId: currentUser.id,
        imageUrl: uploadData.fileUrl,
        caption: uploadData.caption,
        musicData: uploadData.music ? JSON.stringify(uploadData.music) : null
      };
    }

    const response = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
      },
      body: JSON.stringify({
        query: mutation,
        variables
      })
    });

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    // Add to local state for immediate display
    if (uploadData.type === 'reel') {
      const newReel = {
        id: result.data.insert_reels_one.id,
        title: uploadData.caption,
        content: uploadData.caption,
        type: 'reel',
        imageUrl: uploadData.fileUrl,
        fileType: 'video',
        music: uploadData.music,
        user: {
          displayName: currentUser.displayName,
          id: currentUser.id,
          avatarUrl: currentUser.avatarUrl
        },
        createdAt: result.data.insert_reels_one.created_at
      };
      
      setPosts(prev => [newReel, ...prev]);
    } else if (uploadData.type === 'post') {
      const newPost = {
        id: result.data.insert_posts_one.id,
        title: uploadData.caption,
        content: uploadData.caption,
        type: 'post',
        imageUrl: uploadData.fileUrl,
        fileType: uploadData.fileUrl.includes('video') ? 'video' : 'image',
        music: uploadData.music,
        user: {
          displayName: currentUser.displayName,
          id: currentUser.id,
          avatarUrl: currentUser.avatarUrl
        },
        createdAt: result.data.insert_posts_one.created_at
      };
      
      setPosts(prev => [newPost, ...prev]);
    }

    alert(`${uploadData.type === 'story' ? 'Story' : uploadData.type === 'reel' ? 'Reel' : 'Post'} uploaded successfully!`);

  } catch (error) {
    console.error('Upload error:', error);
    alert('Upload failed: ' + error.message);
  } finally {
    setUploadProgress({ isUploading: false, message: '', startTime: null });
  }
};