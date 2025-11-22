// Create sponsored admin user directly via GraphQL
async function createSponsoredAdmin() {
  try {
    console.log('Creating sponsored admin user via direct GraphQL...')
    
    // First create the auth user via Nhost Auth API
    const authResponse = await fetch('https://ofafvhtbuhvvkhuprotc.auth.ap-southeast-1.nhost.run/v1/signup/email-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'sponseredadmin@gmail.com',
        password: 'admin1234',
        options: {
          displayName: 'Sponsored Admin',
          metadata: {
            firstName: 'Sponsored',
            lastName: 'Admin'
          }
        }
      })
    })
    
    const authResult = await authResponse.json()
    console.log('Auth signup result:', authResult)
    
    if (authResult.session?.user?.id) {
      const userId = authResult.session.user.id
      
      // Create profile with sponsored user type
      const profileResponse = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
        },
        body: JSON.stringify({
          query: `mutation CreateSponsoredProfile($userId: uuid!) {
            insert_profiles_one(object: {
              auth_id: $userId,
              username: "sponsoredadmin",
              display_name: "Sponsored Admin",
              user_type: "sponsored",
              bio: "Official sponsored content admin",
              avatar_url: null
            }) {
              id
              auth_id
              display_name
              user_type
            }
          }`,
          variables: { userId }
        })
      })
      
      const profileResult = await profileResponse.json()
      console.log('Profile creation result:', profileResult)
      
      if (profileResult.data?.insert_profiles_one) {
        console.log('✅ Sponsored admin user created successfully!')
        console.log('Email: sponseredadmin@gmail.com')
        console.log('Password: admin1234')
        console.log('User Type: sponsored')
      }
    }
    
  } catch (error) {
    console.error('Error creating sponsored admin:', error)
  }
}

createSponsoredAdmin()