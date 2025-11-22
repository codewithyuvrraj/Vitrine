// Create sponsored admin user programmatically
import { nhost } from './src/lib/nhost.js'

async function createSponsoredAdmin() {
  try {
    console.log('Creating sponsored admin user...')
    
    // Sign up the sponsored admin user
    const { data, error } = await nhost.auth.signUp({
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
    
    if (error) {
      console.error('Signup error:', error)
      return
    }
    
    console.log('User created:', data)
    
    // Update user profile to set user_type as sponsored
    if (data?.user?.id) {
      const response = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
        },
        body: JSON.stringify({
          query: `mutation UpdateUserType($userId: uuid!) {
            update_profiles(
              where: {auth_id: {_eq: $userId}}
              _set: {user_type: "sponsored"}
            ) {
              affected_rows
              returning {
                auth_id
                display_name
                user_type
              }
            }
          }`,
          variables: { userId: data.user.id }
        })
      })
      
      const result = await response.json()
      console.log('Profile update result:', result)
    }
    
  } catch (error) {
    console.error('Error creating sponsored admin:', error)
  }
}

createSponsoredAdmin()