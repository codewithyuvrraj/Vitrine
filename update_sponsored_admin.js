// Update existing sponsored admin user to have sponsored type
async function updateSponsoredAdmin() {
  try {
    console.log('Updating existing sponsored admin user...')
    
    const userId = '39bb60e8-2e58-4645-b6d9-ffcb48539694' // From the previous output
    
    // Update profile to set user_type as sponsored
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
            _set: {
              user_type: "sponsored",
              display_name: "Sponsored Admin",
              bio: "Official sponsored content admin"
            }
          ) {
            affected_rows
            returning {
              auth_id
              display_name
              user_type
              bio
            }
          }
        }`,
        variables: { userId }
      })
    })
    
    const result = await response.json()
    console.log('Profile update result:', result)
    
    if (result.data?.update_profiles?.affected_rows > 0) {
      console.log('✅ Sponsored admin user updated successfully!')
      console.log('Email: sponseredadmin@gmail.com')
      console.log('Password: admin1234')
      console.log('User Type: sponsored')
    }
    
  } catch (error) {
    console.error('Error updating sponsored admin:', error)
  }
}

updateSponsoredAdmin()