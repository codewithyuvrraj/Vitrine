// Check what tables exist in the database
const checkTables = async () => {
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
              queryType {
                fields {
                  name
                  type {
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
            }
          }
        `
      })
    })
    
    const result = await response.json()
    console.log('Available tables:')
    
    const fields = result.data.__schema.queryType.fields
    const tables = fields.filter(field => 
      !field.name.startsWith('_') && 
      !field.name.includes('aggregate') &&
      !field.name.includes('by_pk')
    )
    
    tables.forEach(table => {
      console.log(`- ${table.name}`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  }
}

checkTables()