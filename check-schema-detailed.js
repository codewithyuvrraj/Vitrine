// Check detailed schema of posts, comments, likes tables
const checkDetailedSchema = async () => {
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
                    ofType {
                      name
                    }
                  }
                }
              }
            }
          }
        `
      })
    })
    
    const result = await response.json()
    const types = result.data.__schema.types
    
    // Check posts table
    const postsTable = types.find(t => t.name === 'posts')
    console.log('POSTS TABLE FIELDS:')
    if (postsTable?.fields) {
      postsTable.fields.forEach(field => {
        console.log(`- ${field.name}: ${field.type?.name || field.type?.ofType?.name || 'complex'}`)
      })
    }
    
    console.log('\nLIKES TABLE FIELDS:')
    const likesTable = types.find(t => t.name === 'likes')
    if (likesTable?.fields) {
      likesTable.fields.forEach(field => {
        console.log(`- ${field.name}: ${field.type?.name || field.type?.ofType?.name || 'complex'}`)
      })
    }
    
    console.log('\nCOMMENTS TABLE FIELDS:')
    const commentsTable = types.find(t => t.name === 'comments')
    if (commentsTable?.fields) {
      commentsTable.fields.forEach(field => {
        console.log(`- ${field.name}: ${field.type?.name || field.type?.ofType?.name || 'complex'}`)
      })
    }
    
    console.log('\nREELS TABLE FIELDS:')
    const reelsTable = types.find(t => t.name === 'reels')
    if (reelsTable?.fields) {
      reelsTable.fields.forEach(field => {
        console.log(`- ${field.name}: ${field.type?.name || field.type?.ofType?.name || 'complex'}`)
      })
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

checkDetailedSchema()