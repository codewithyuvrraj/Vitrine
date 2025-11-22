// Quick script to check actual database schema
const checkSchema = async () => {
  try {
    const response = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
      },
      body: JSON.stringify({
        query: `
          query IntrospectionQuery {
            __schema {
              types {
                name
                fields {
                  name
                  type {
                    name
                  }
                }
              }
            }
          }
        `
      })
    })
    
    const result = await response.json()
    
    // Find likes and comments tables
    const types = result.data.__schema.types
    const likesTable = types.find(t => t.name === 'likes')
    const commentsTable = types.find(t => t.name === 'comments')
    
    console.log('LIKES TABLE FIELDS:')
    if (likesTable?.fields) {
      likesTable.fields.forEach(field => {
        console.log(`- ${field.name}: ${field.type?.name || 'complex'}`)
      })
    } else {
      console.log('No likes table found')
    }
    
    console.log('\nCOMMENTS TABLE FIELDS:')
    if (commentsTable?.fields) {
      commentsTable.fields.forEach(field => {
        console.log(`- ${field.name}: ${field.type?.name || 'complex'}`)
      })
    } else {
      console.log('No comments table found')
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

checkSchema()