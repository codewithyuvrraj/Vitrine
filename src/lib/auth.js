import { nhost } from './nhost';
import { uploadToCloudinary } from './cloudinary';

export async function signUpUser(email, password, profileData = {}) {
  const res = await nhost.auth.signUpEmailPassword({
    email,
    password
  });
  
  if (res.error) throw new Error(res.error.message);
  
  // If signup successful and profile data provided, create profile
  if (res.session?.user?.id && profileData) {
    try {
      const userId = res.session.user.id;
      const { firstName, lastName, bio, website, profilePic } = profileData;
      
      // Upload profile picture if provided
      let avatarUrl = null;
      if (profilePic) {
        try {
          avatarUrl = await uploadToCloudinary(profilePic, 'image');
        } catch (uploadError) {
          console.log('Profile pic upload failed, continuing without it:', uploadError);
        }
      }
      
      // Create profile with complete data
      const displayName = firstName && lastName ? `${firstName} ${lastName}` : firstName || email.split('@')[0];
      const username = displayName.toLowerCase().replace(/[^a-z0-9]/g, '') || email.split('@')[0].replace(/[^a-z0-9]/g, '');
      
      await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
        },
        body: JSON.stringify({
          query: `mutation CreateProfile($userId: uuid!, $displayName: String!, $username: String!, $avatarUrl: String, $bio: String!, $website: String!) {
            insert_profiles_one(object: {
              auth_id: $userId,
              username: $username,
              display_name: $displayName,
              avatar_url: $avatarUrl,
              bio: $bio,
              website: $website
            }) {
              id
            }
          }`,
          variables: {
            userId,
            displayName,
            username,
            avatarUrl,
            bio: bio || '',
            website: website || ''
          }
        })
      });
      
      console.log('✅ Profile created with signup data');
    } catch (profileError) {
      console.error('Failed to create profile during signup:', profileError);
      // Don't throw error here as auth account was created successfully
    }
  }
  
  return res.session;
}

export async function loginUser(email, password) {
  const res = await nhost.auth.signInEmailPassword({ 
    email, 
    password 
  });
  
  if (res.error) throw new Error(res.error.message);
  return res.session;
}